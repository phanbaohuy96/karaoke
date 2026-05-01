import type { YouTubeSearchResult } from '../types/session';

export async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
  const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message ?? 'Tìm kiếm YouTube thất bại.');
  }

  return payload.results as YouTubeSearchResult[];
}
