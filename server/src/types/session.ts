export type ClientRole = 'host' | 'guest';

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
}

export interface PlaylistItem extends YouTubeSearchResult {
  id: string;
  youtubeVideoId: string;
  requestedBy: string;
  addedAt: number;
}

export interface ClientInfo {
  clientId: string;
  role: ClientRole;
}

export interface KaraokeSession {
  id: string;
  hostToken: string;
  createdAt: number;
  joinUrl: string;
  hostClientId?: string;
  playlist: PlaylistItem[];
  nowPlaying: PlaylistItem | null;
  isPlaying: boolean;
  clients: Map<string, ClientInfo>;
}

export interface SessionSnapshot {
  id: string;
  createdAt: number;
  joinUrl: string;
  playlist: PlaylistItem[];
  nowPlaying: PlaylistItem | null;
  isPlaying: boolean;
  clientCount: number;
}

export interface CreateSessionResult {
  sessionId: string;
  hostToken: string;
  joinUrl: string;
  snapshot: SessionSnapshot;
}
