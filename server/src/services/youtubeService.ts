import type { YouTubeSearchResult } from '../types/session.js';

interface YouTubeSearchResponse {
  items?: Array<{
    id?: {
      videoId?: string;
    };
    snippet?: {
      title?: string;
      channelTitle?: string;
      thumbnails?: {
        medium?: {
          url?: string;
        };
        default?: {
          url?: string;
        };
      };
    };
  }>;
  error?: {
    message?: string;
  };
}

export class YouTubeApiError extends Error {
  constructor(message: string, readonly statusCode = 502) {
    super(message);
  }
}

export async function searchYouTube(apiKey: string, query: string): Promise<YouTubeSearchResult[]> {
  const trimmedQuery = query.trim();

  if (!apiKey) {
    throw new YouTubeApiError('Vui lòng cấu hình YOUTUBE_API_KEY trong .env để tìm kiếm YouTube.', 500);
  }

  if (!trimmedQuery) {
    throw new YouTubeApiError('Vui lòng nhập từ khóa tìm kiếm.', 400);
  }

  const params = new URLSearchParams({
    key: apiKey,
    part: 'snippet',
    q: trimmedQuery,
    type: 'video',
    videoEmbeddable: 'true',
    maxResults: '10',
  });

  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
  const payload = (await response.json()) as YouTubeSearchResponse;

  if (!response.ok) {
    throw new YouTubeApiError(payload.error?.message ?? 'Tìm kiếm YouTube thất bại.', response.status);
  }

  return (payload.items ?? [])
    .map((item): YouTubeSearchResult | null => {
      const videoId = item.id?.videoId;
      const title = item.snippet?.title;
      const channelTitle = item.snippet?.channelTitle;
      const thumbnailUrl = item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url;

      if (!videoId || !title || !channelTitle || !thumbnailUrl) {
        return null;
      }

      return {
        videoId,
        title,
        channelTitle,
        thumbnailUrl,
      };
    })
    .filter((item): item is YouTubeSearchResult => item !== null);
}
