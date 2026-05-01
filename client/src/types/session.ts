export type ClientRole = 'host' | 'guest';

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
}

export interface PlaylistItem extends YouTubeSearchResult {
  id: string;
  requestedBy: ClientRole;
  addedAt: number;
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

export interface CreateSessionResponse {
  sessionId: string;
  hostToken: string;
  joinUrl: string;
  snapshot: SessionSnapshot;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export type ClientSocketMessage =
  | {
      type: 'join_session';
      sessionId: string;
      role: ClientRole;
      hostToken?: string;
    }
  | {
      type: 'add_song';
      song: YouTubeSearchResult;
    }
  | {
      type: 'remove_song';
      itemId: string;
    }
  | {
      type: 'set_now_playing';
      itemId: string;
    }
  | {
      type: 'play_next';
    }
  | {
      type: 'set_playing';
      isPlaying: boolean;
    };

export type ServerSocketMessage =
  | {
      type: 'session_snapshot';
      snapshot: SessionSnapshot;
    }
  | {
      type: 'error';
      message: string;
    };
