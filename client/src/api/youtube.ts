import { readJsonResponse } from './readJsonResponse';
import type { YouTubeSearchResult } from '../types/session';

export async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
  const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
  const payload = await readJsonResponse<{ results: YouTubeSearchResult[] }>(response, 'Tìm kiếm YouTube thất bại.');
  return payload.results;
}
