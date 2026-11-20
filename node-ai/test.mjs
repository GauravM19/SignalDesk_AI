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

