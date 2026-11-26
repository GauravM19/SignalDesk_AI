import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import next from 'next';
import { auditLinks } from './link-audit.mjs';

test('audit detects missing routes, anchors and empty links', async () => {
  const result = await auditLinks(['/'], async path => path === '/' ? {
    status: 200,
    html: '<a href="/missing">Missing</a><a href="#missing">Anchor</a><a href="#">Empty</a>'
  } : { status: 404, html: '' });
  assert.equal(result.errors.length, 3);
  assert.ok(result.errors.some(error => error.includes('returned 404')));
  assert.ok(result.errors.some(error => error.includes('missing anchor')));
  assert.ok(result.errors.some(error => error.includes('empty destination')));
});

test('audit accepts cross-page anchors and skips external/contact links', async () => {
  const pages = {
    '/': '<a href="/dashboard#chat">Chat</a><a href="mailto:owner@example.test">Email</a><a href="https://example.test">External</a>',
    '/dashboard': '<section id="chat"></section><a href="/">Home</a>'
  };
  const result = await auditLinks(Object.keys(pages), async path => ({ status: 200, html: pages[path] }));
  assert.deepEqual(result, { errors: [], checked: 2 });
});

test('all landing and dashboard links resolve in the production build', { timeout: 60000 }, async () => {
  const app = next({ dev: false, dir: process.cwd() });
  let server;
  try {
    await app.prepare();
    server = createServer(app.getRequestHandler());
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    const home = await fetch(base).then(response => response.text());
    const dashboard = await fetch(`${base}/dashboard`).then(response => response.text());
    const expectedMetadata = [
      [home, 'SignalDesk AI | Research workspace', 'Explore SignalDesk AI, a research workspace prototype for organising sources, viewing briefings and asking AI questions.'],
      [dashboard, 'Dashboard | SignalDesk AI', 'Manage your SignalDesk sources, view briefing records and ask questions from the workspace dashboard.']
    ];
    for (const [html, title, description] of expectedMetadata) {
      assert.deepEqual([...html.matchAll(/<title>(.*?)<\/title>/g)].map(match => match[1]), [title], 'Each route has exactly one descriptive title');
      assert.deepEqual([...html.matchAll(/<meta name="description" content="([^"]*)"\/?\s*>/g)].map(match => match[1]), [description], 'Each route has exactly one honest description');
    }
    for (const html of [home, dashboard]) {
      assert.match(html, /<link[^>]*rel="icon"[^>]*href="\/icon\.svg(?:\?[^\"]*)?"/, 'Each page advertises the app favicon');
    }
    const icon = await fetch(`${base}/icon.svg`);
    assert.equal(icon.status, 200);
    assert.match(icon.headers.get('content-type'), /image\/svg\+xml/);
    const svg = await icon.text();
    assert.match(svg, /viewBox="0 0 64 64"/);
    assert.match(svg, /<title>SignalDesk<\/title>/);
    assert.ok(Buffer.byteLength(svg) < 1024, 'Vector favicon remains below 1 KB');
    const menu = home.match(/<details\b[^>]*class="mobile-menu"[^>]*>([\s\S]*?)<\/details>/);
    assert.ok(menu, 'Landing page must render a native, keyboard-operable mobile disclosure');
    assert.doesNotMatch(menu[0].split('>')[0], /\bopen(?:\s|=|$)/, 'Menu starts closed');
    assert.match(menu[1], /<summary[^>]*aria-controls="mobile-navigation"[^>]*>Menu<\/summary>/);
    assert.match(menu[1], /id="mobile-navigation"/);
    assert.match(menu[1], /href="\/dashboard"/);
    for (const path of ['/missing-page', '/dashboard/missing-page']) {
      const response = await fetch(`${base}${path}`);
      assert.equal(response.status, 404, 'Unknown URLs must retain the HTTP 404 status');
      const html = await response.text();
      assert.match(html, /id="not-found-title">This page is off the radar\./);
      assert.match(html, /name="robots" content="noindex"/);
      assert.match(html, /aria-label="Page recovery"/);
      // Audit recovery destinations, while separately asserting the source is a 404.
      const recovery = await auditLinks([path], async target => {
        if (target === path) return { status: 200, html };
        const destination = await fetch(`${base}${target}`);
        return { status: destination.status, html: await destination.text() };
      });
      assert.equal(recovery.checked, 3, 'The brand and both recovery links are checked');
      assert.deepEqual(recovery.errors, []);
    }
    const result = await auditLinks(['/', '/dashboard'], async path => {
      const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(10000) });
      return { status: response.status, html: await response.text() };
    });
    assert.ok(result.checked > 0, 'The audit must actually inspect rendered links');
    assert.deepEqual(result.errors, []);
    console.log(`Checked ${result.checked} internal links across both pages.`);
  } finally {
    if (server) {
      const closed = new Promise(resolve => server.close(resolve));
      server.closeAllConnections();
      await closed;
    }
    await app.close();
  }
});
