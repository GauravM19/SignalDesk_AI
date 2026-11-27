export function requestResearch(question: string, baseUrl: string, fetcher?: typeof fetch): Promise<{ answer: string; label: string }>;
