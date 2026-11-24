/** Audit rendered anchors against local routes and element IDs, without visiting external sites. */
export async function auditLinks(paths, loadPage) {
  const base = 'http://signaldesk.local';
  const cache = new Map();
  const page = async path => {
    if (!cache.has(path)) cache.set(path, await loadPage(path));
    return cache.get(path);
  };
  const errors = [];
  let checked = 0;
  for (const path of paths) {
    const source = await page(path);
    if (source.status !== 200) {
      errors.push(`${path}: page returned ${source.status}`);
      continue;
    }
    for (const match of source.html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)) {
      const href = match[2].replaceAll('&amp;', '&');
      if (!href.trim() || href === '#') {
        errors.push(`${path}: empty destination`);
        continue;
      }
      const target = new URL(href, `${base}${path}`);
      if (target.origin !== base) continue;
      checked++;
      const destination = await page(target.pathname);
      if (destination.status !== 200) {
        errors.push(`${path}: ${href} returned ${destination.status}`);
        continue;
      }
      if (target.hash) {
        const id = decodeURIComponent(target.hash.slice(1));
        const ids = [...destination.html.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)].map(m => m[2]);
        if (!ids.includes(id)) errors.push(`${path}: missing anchor ${href}`);
      }
    }
  }
  return { errors, checked };
}
