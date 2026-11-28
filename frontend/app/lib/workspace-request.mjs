/** Validate both lists before replacing the last known workspace snapshot. */
export async function fetchWorkspace(baseUrl, fetcher = fetch) {
  const read = async (path, fields) => {
    const response = await fetcher(`${baseUrl.replace(/\/$/, '')}${path}`, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Workspace API unavailable');
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.some(row => !row || fields.some(field => typeof row[field] !== 'string'))) {
      throw new Error('Workspace API returned invalid records');
    }
    return rows;
  };
  const [sources, briefings] = await Promise.all([
    read('/api/sources', ['id', 'name', 'type', 'url', 'status']),
    read('/api/briefings/today', ['title', 'topic', 'summary', 'deliveryTime', 'status'])
  ]);
  return { sources, briefings };
}
