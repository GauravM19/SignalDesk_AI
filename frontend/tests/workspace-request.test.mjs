import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchWorkspace } from '../app/lib/workspace-request.mjs';

test('workspace preserves empty lists as real zero counts, not demo fallbacks', async () => {
  const paths = [];
  const result = await fetchWorkspace('http://api/', async (url, options) => {
    paths.push(url);
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json([]);
  });
  assert.deepEqual(result, { sources: [], briefings: [] });
  assert.deepEqual(paths.sort(), ['http://api/api/briefings/today', 'http://api/api/sources']);
});

test('workspace accepts actual source and briefing records without inventing data', async () => {
  const sources = [{ id: '1', name: 'News', type: 'RSS', url: 'https://example.org', status: 'READY' }];
  const briefings = [{ title: 'Demo', topic: 'AI', summary: 'Preview', deliveryTime: '08:00', status: 'READY' }];
  const result = await fetchWorkspace('http://api', async url => Response.json(url.endsWith('/sources') ? sources : briefings));
  assert.deepEqual(result, { sources, briefings });
});

test('workspace refuses a partial or failed snapshot', async () => {
  for (const failedPath of ['/sources', '/today']) {
    await assert.rejects(fetchWorkspace('http://api', async url => Response.json([], { status: url.endsWith(failedPath) ? 500 : 200 })), /unavailable/);
  }
});

test('workspace rejects malformed JSON, wrong list shape and incomplete records', async () => {
  await assert.rejects(fetchWorkspace('http://api', async () => new Response('invalid')));
  for (const body of [null, {}, [null], [{}], [{ id: 5 }]]) {
    await assert.rejects(fetchWorkspace('http://api', async () => Response.json(body)), /invalid records/);
  }
});
