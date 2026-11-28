import type { SavedSource } from './source-request.mjs';
export type BriefingRecord = { title: string; topic: string; summary: string; deliveryTime: string; status: string };
export function fetchWorkspace(baseUrl: string, fetcher?: typeof fetch): Promise<{ sources: SavedSource[]; briefings: BriefingRecord[] }>;
