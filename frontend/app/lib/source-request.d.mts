export type SavedSource = { id: string; name: string; type: string; url: string; status: string };
export function saveSource(name: string, url: string, baseUrl: string, fetcher?: typeof fetch): Promise<SavedSource>;
