import type { Server } from 'node:http';

/** Drain HTTP requests, with a deadline shorter than Docker's default stop grace. */
export function installShutdown(server: Server, graceMs = 8000): void {
  let stopping = false;
  // A connection active at shutdown may become keep-alive idle afterwards.
  server.on('request', (_req, res) => {
    res.on('finish', () => {
      if (stopping) setImmediate(() => server.closeIdleConnections());
    });
  });
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => {
      server.closeAllConnections();
      process.exit(1);
    }, graceMs);

    // Stop accepting connections, but allow active responses to finish.
    server.close(() => {
      clearTimeout(deadline);
      process.exit(0);
    });
    server.closeIdleConnections();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
