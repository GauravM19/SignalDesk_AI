import test from 'node:test';
import assert from 'node:assert/strict';
import { saveSource } from '../app/lib/source-request.mjs';

const source = { id: 'source-id', name: 'News', type: 'RSS', url: 'https://example.org/feed', status: 'READY' };

test('source save validates name, URL scheme, length and credentials before requesting', async () => {
  for (const [name, url] of [[' ', source.url], ['x'.repeat(256), source.url], ['News', 'invalid'], ['News', 'javascript:alert(1)'], ['News', 'https://user:pass@example.org'], ['News', 'https://example.org/' + 'x'.repeat(1000)]]) {
    await assert.rejects(saveSource(name, url, 'http://api', () => assert.fail('Must not fetch')));
  }
});

test('source save sends trimmed metadata once with a deadline and accepts the API record', async () => {
  let calls = 0;
  const saved = await saveSource(' News ', ` ${source.url} `, 'http://api/', async (url, options) => {
    calls++;
    assert.equal(url, 'http://api/api/sources');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { name: 'News', type: 'RSS', url: source.url });
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json(source, { status: 201 });
  });
  assert.deepEqual(saved, source);
  assert.equal(calls, 1);
});

test('source save rejects API errors without surfacing private server details', async () => {
  for (const status of [400, 500]) {
    await assert.rejects(saveSource('News', source.url, 'http://api', async () => Response.json({ secret: 'server detail' }, { status })), error => {
      assert.doesNotMatch(error.message, /server detail/);
      assert.match(error.message, status === 400 ? /rejected/ : /Refresh before retrying/);
      return true;
    });
  }
});

test('source save treats network failure as uncertain and does not retry a POST', async () => {
  let calls = 0;
  await assert.rejects(saveSource('News', source.url, 'http://api', async () => { calls++; throw new Error('network'); }), /Refresh.*duplicate/);
  assert.equal(calls, 1);
});

test('source save rejects unreadable and incomplete successful responses', async () => {
  await assert.rejects(saveSource('News', source.url, 'http://api', async () => new Response('invalid')), /unreadable/);
  for (const data of [null, {}, { ...source, id: '' }, { ...source, status: null }]) {
    await assert.rejects(saveSource('News', source.url, 'http://api', async () => Response.json(data)), /incomplete/);
  }
});
