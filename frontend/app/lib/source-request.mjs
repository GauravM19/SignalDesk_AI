/** Save metadata only; this endpoint does not ingest or index a feed. */
export async function saveSource(name, url, baseUrl, fetcher = fetch) {
  const cleanName = name.trim();
  const cleanUrl = url.trim();
  if (!cleanName || cleanName.length > 255) throw new Error('Enter a source name between 1 and 255 characters.');
  let parsed;
  try { parsed = new URL(cleanUrl); } catch { throw new Error('Enter a valid HTTP or HTTPS feed URL.'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || cleanUrl.length > 1000) {
    throw new Error('Use an HTTP or HTTPS URL without login details, up to 1000 characters.');
  }
  let response;
  try {
    response = await fetcher(`${baseUrl.replace(/\/$/, '')}/api/sources`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: cleanName, type: 'RSS', url: cleanUrl }),
      signal: AbortSignal.timeout(15000)
    });
  } catch {
    throw new Error('Could not confirm the save. Refresh the workspace before retrying to avoid a duplicate.');
  }
  if (!response.ok) throw new Error(response.status === 400
    ? 'The API rejected this source. Check its name and URL.'
    : 'The API could not confirm the save. Refresh before retrying.');
  let source;
  try { source = await response.json(); } catch { throw new Error('The save response was unreadable. Refresh before retrying.'); }
  if (!source || ['id', 'name', 'type', 'url', 'status'].some(key => typeof source[key] !== 'string' || !source[key].trim())) {
    throw new Error('The save response was incomplete. Refresh before retrying.');
  }
  return source;
}
