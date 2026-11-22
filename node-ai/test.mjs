import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';

// Use the existing TypeScript runtime and an ephemeral port, never a real provider.
let child;
let baseUrl;

before(async () => {
  const script = `
    const { app } = require('./src/server.ts');
    const server = app.listen(0, '127.0.0.1', () => {
      process.send({ port: server.address().port });
    });
    process.on('message', () => server.close(() => process.exit(0)));
  `;
  child = fork('-e', [script], {
    cwd: new URL('.', import.meta.url),
    execArgv: ['--import', 'tsx'],
    env: { ...process.env, NODE_ENV: 'test', OPENAI_API_KEY: '' },
    stdio: ['ignore', 'inherit', 'inherit', 'ipc']
  });
  const [message] = await once(child, 'message', {
    signal: AbortSignal.timeout(15000)
  });
  baseUrl = `http://127.0.0.1:${message.port}`;
});

after(async () => {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, 'exit');
  child.kill();
  await exited;
});

async function post(path, payload) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

// Isolate provider mocks in a child process so they cannot affect other tests.
async function withProviderMock(mockBody, run) {
  const script = `
    const { ChatOpenAI } = require('@langchain/openai');
    ChatOpenAI.prototype.invoke = async () => { ${mockBody} };
    const { app } = require('./src/server.ts');
    const server = app.listen(0, '127.0.0.1', () => process.send({ port: server.address().port }));
  `;
  const server = fork('-e', [script], {
    cwd: new URL('.', import.meta.url), execArgv: ['--import', 'tsx'],
    env: { ...process.env, NODE_ENV: 'test', OPENAI_API_KEY: 'test-only-not-a-real-key' },
    stdio: ['ignore', 'inherit', 'inherit', 'ipc']
  });
  try {
    const [message] = await once(server, 'message', { signal: AbortSignal.timeout(15000) });
    await run(`http://127.0.0.1:${message.port}`);
  } finally {
    if (server.exitCode === null) {
      const exited = once(server, 'exit');
      server.kill();
      await exited;
    }
  }
}

test('provider failures return a safe error without upstream details', async () => {
  await withProviderMock("throw new Error('secret-api-key private-source-text');", async url => {
    const response = await fetch(`${url}/ai/chat`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'What changed?', context: 'A supplied research passage.' }),
      signal: AbortSignal.timeout(5000)
    });
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), {
      error: 'AI provider unavailable', code: 'AI_PROVIDER_UNAVAILABLE'
    });
  });
});

for (const [label, content, expected] of [
  ['plain text', '  A supported-looking answer.  ', 'A supported-looking answer.'],
  ['text blocks', [{ type: 'text', text: 'First point.' }, { type: 'image_url', image_url: 'unused' }, { type: 'text', text: 'Second point.' }], 'First point.\nSecond point.']
]) {
  test(`provider ${label} is readable and is not automatically marked grounded`, async () => {
    await withProviderMock(`return { content: ${JSON.stringify(content)} };`, async url => {
      const response = await fetch(`${url}/ai/chat`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: 'What changed?', context: 'Some source text.' }),
        signal: AbortSignal.timeout(5000)
      });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.answer, expected);
      assert.equal(body.grounded, false);
      assert.equal(body.groundingStatus, 'unverified');
      assert.equal(body.contextProvided, true);
      assert.deepEqual(body.citations, []);
    });
  });
}

test('empty provider output is rejected instead of returning a blank answer', async () => {
  await withProviderMock("return { content: '   ' };", async url => {
    const response = await fetch(`${url}/ai/chat`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'What changed?', context: 'Some source text.' }),
      signal: AbortSignal.timeout(5000)
    });
    assert.equal(response.status, 502);
    assert.equal((await response.json()).code, 'AI_PROVIDER_UNAVAILABLE');
  });
});

test('health explicitly identifies demo mode without a provider key', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'ok', service: 'signaldesk-node-ai', mode: 'demo'
  });
});

for (const [label, question] of [
  ['missing', undefined],
  ['blank', '   '],
  ['too short', 'ab'],
  ['wrong type', 123],
  ['too long', 'x'.repeat(501)]
]) {
  test(`chat rejects a ${label} question`, async () => {
    const response = await post('/ai/chat', { question });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.ok(body.error.fieldErrors.question.length > 0);
  });
}

test('chat rejects context exceeding its size limit', async () => {
  const response = await post('/ai/chat', {
    question: 'What changed?', context: 'x'.repeat(12001)
  });
  assert.equal(response.status, 400);
  assert.ok((await response.json()).error.fieldErrors.context.length > 0);
});

test('demo answers trim the question and never claim grounding', async () => {
  const response = await post('/ai/chat', { question: '  What changed?  ' });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.mode, 'demo');
  assert.equal(body.grounded, false);
  assert.deepEqual(body.citations, []);
  assert.ok(body.answer.includes('“What changed?”'));
  assert.ok(body.answer.includes('No sources have been retrieved.'));
});

test('chat accepts the maximum question and context lengths', async () => {
  const response = await post('/ai/chat', {
    question: 'x'.repeat(500), context: 'x'.repeat(12000)
  });
  assert.equal(response.status, 200);
});

for (const title of [undefined, '', '   ', 'x'.repeat(201)]) {
  test(`summarise rejects an invalid title of length ${title?.length ?? 'missing'}`, async () => {
    const response = await post('/ai/summarise', { title });
    assert.equal(response.status, 400);
    assert.ok((await response.json()).error.fieldErrors.title.length > 0);
  });
}

test('summarise returns the trimmed title', async () => {
  const response = await post('/ai/summarise', { title: '  Research notes  ' });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.title, 'Research notes');
  assert.ok(Array.isArray(body.keyPoints));
});

test('malformed JSON is rejected before reaching the chat handler', async () => {
  const response = await fetch(`${baseUrl}/ai/chat`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{'
  });
  assert.equal(response.status, 400);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.deepEqual(await response.json(), {
    error: 'Invalid JSON request body', code: 'INVALID_JSON'
  });
});

test('JSON payloads larger than the body limit are rejected', async () => {
  const response = await post('/ai/chat', { question: 'x'.repeat(270000) });
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), {
    error: 'Request body exceeds the 256kb limit', code: 'PAYLOAD_TOO_LARGE'
  });
});

test('unsupported body encoding returns JSON without leaking internals', async () => {
  const response = await fetch(`${baseUrl}/ai/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'content-encoding': 'unsupported' },
    body: JSON.stringify({ question: 'What changed?' })
  });
  assert.equal(response.status, 415);
  assert.deepEqual(await response.json(), {
    error: 'Unsupported request encoding', code: 'UNSUPPORTED_ENCODING'
  });
});

test('configured AI abstains without context and never invokes the provider', async () => {
  const script = `
    const { ChatOpenAI } = require('@langchain/openai');
    ChatOpenAI.prototype.invoke = async () => {
      throw new Error('Provider must not be invoked without evidence');
    };
    const { app } = require('./src/server.ts');
    const server = app.listen(0, '127.0.0.1', () => {
      process.send({ port: server.address().port });
    });
  `;
  const server = fork('-e', [script], {
    cwd: new URL('.', import.meta.url),
    execArgv: ['--import', 'tsx'],
    env: { ...process.env, NODE_ENV: 'test', OPENAI_API_KEY: 'test-only-not-a-real-key' },
    stdio: ['ignore', 'inherit', 'inherit', 'ipc']
  });
  try {
    const [message] = await once(server, 'message', { signal: AbortSignal.timeout(15000) });
    for (const context of [undefined, '', '   ']) {
      const response = await fetch(`http://127.0.0.1:${message.port}/ai/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: 'What changed?', context }),
        signal: AbortSignal.timeout(5000)
      });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.status, 'insufficient_evidence');
      assert.equal(body.grounded, false);
      assert.equal(body.mode, 'openai');
      assert.deepEqual(body.citations, []);
      assert.match(body.answer, /Supply source context/);
    }
  } finally {
    if (server.exitCode === null) {
      const exited = once(server, 'exit');
      server.kill();
      await exited;
    }
  }
});

