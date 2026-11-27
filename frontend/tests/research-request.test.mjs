import test from 'node:test';
import assert from 'node:assert/strict';
import { requestResearch } from '../app/lib/research-request.mjs';

test('research validates trimmed question bounds before making a request', async () => {
  for (const question of ['', '  ab  ', 'x'.repeat(501)]) {
    await assert.rejects(requestResearch(question, 'http://ai', () => assert.fail('Must not fetch')), /3 and 500/);
  }
});

test('research sends trimmed JSON with a deadline and identifies demo output', async () => {
  const result = await requestResearch('  Explain SQL  ', 'http://ai/', async (url, options) => {
    assert.equal(url, 'http://ai/ai/chat');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['content-type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), { question: 'Explain SQL' });
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ answer: '  Example only  ', mode: 'demo' });
  });
  assert.deepEqual(result, { answer: 'Example only', label: 'Demo response — not evidence-backed' });
});

test('research does not claim missing or unverified evidence is grounded', async () => {
  for (const [data, expected] of [
    [{ answer: 'Need context', status: 'insufficient_evidence', mode: 'openai' }, /Insufficient evidence/],
    [{ answer: 'A model answer', grounded: true, mode: 'openai' }, /not been verified/]
  ]) {
    const result = await requestResearch('Question', 'http://ai', async () => Response.json(data));
    assert.match(result.label, expected);
  }
});

test('research rejects HTTP errors without exposing upstream messages as answers', async () => {
  for (const status of [400, 429, 500, 502]) {
    await assert.rejects(requestResearch('Question', 'http://ai', async () => Response.json({ answer: 'secret upstream detail' }, { status })), error => {
      assert.doesNotMatch(error.message, /secret/);
      assert.match(error.message, status === 429 ? /Too many requests/ : /could not complete/);
      return true;
    });
  }
});

test('research rejects malformed JSON and missing or blank answers', async () => {
  await assert.rejects(requestResearch('Question', 'http://ai', async () => new Response('<html>error</html>')), /unreadable/);
  for (const data of [null, {}, { answer: ' ' }, { answer: 42 }]) {
    await assert.rejects(requestResearch('Question', 'http://ai', async () => Response.json(data)), /no answer/);
  }
});

test('research distinguishes timeouts from network failures using safe messages', async () => {
  for (const name of ['TimeoutError', 'AbortError', 'TypeError']) {
    await assert.rejects(requestResearch('Question', 'http://ai', async () => {
      throw Object.assign(new Error('sensitive network detail'), { name });
    }), name === 'TypeError' ? /Cannot reach/ : /timed out/);
  }
});
