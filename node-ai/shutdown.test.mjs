import test from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';

async function startServer(handler, graceMs = 2000) {
  const script = `
    const { createServer } = require('node:http');
    const { installShutdown } = require('./src/shutdown.ts');
    const server = createServer((req, res) => { ${handler} });
    installShutdown(server, ${graceMs});
    server.listen(0, '127.0.0.1', () => process.send({ port: server.address().port }));
  `;
  const child = fork('-e', [script], {
    cwd: new URL('.', import.meta.url), execArgv: ['--import', 'tsx'],
    stdio: ['ignore', 'inherit', 'inherit', 'ipc']
  });
  try {
    const [message] = await once(child, 'message', { signal: AbortSignal.timeout(10000) });
    return { child, url: `http://127.0.0.1:${message.port}` };
  } catch (error) {
    child.kill('SIGKILL');
    throw error;
  }
}

for (const signal of ['SIGTERM', 'SIGINT']) {
  test(`${signal} drains an active request and exits successfully`, { timeout: 15000 }, async () => {
    const { child, url } = await startServer(`
      process.send({ started: true });
      setTimeout(() => res.end('completed'), 200);
    `);
    try {
      const started = once(child, 'message', { signal: AbortSignal.timeout(5000) });
      const response = fetch(url, { signal: AbortSignal.timeout(5000) }).then(r => r.text());
      await started;
      const exited = once(child, 'exit', { signal: AbortSignal.timeout(5000) });
      child.kill(signal);
      assert.equal(await response, 'completed');
      assert.deepEqual(await exited, [0, null]);
      await assert.rejects(fetch(url, { signal: AbortSignal.timeout(1000) }));
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }
  });
}

test('shutdown deadline terminates a stuck request with a failure exit code', { timeout: 15000 }, async () => {
  const { child, url } = await startServer("process.send({ started: true });", 100);
  try {
    const started = once(child, 'message', { signal: AbortSignal.timeout(5000) });
    // Attach rejection handling immediately: a deadline deliberately closes the socket.
    const request = fetch(url, { signal: AbortSignal.timeout(5000) }).then(
      () => 'unexpected response', () => 'connection closed'
    );
    await started;
    const exited = once(child, 'exit', { signal: AbortSignal.timeout(5000) });
    child.kill('SIGTERM');
    assert.deepEqual(await exited, [1, null]);
    assert.equal(await request, 'connection closed');
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  }
});
