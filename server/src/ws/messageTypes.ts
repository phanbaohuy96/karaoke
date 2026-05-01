import type { ClientRole, SessionSnapshot, YouTubeSearchResult } from '../types/session.js';

export type ClientMessage =
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
    }
  | {
      type: 'set_volume';
      volume: number;
    };

export type ServerMessage =
  | {
      type: 'session_snapshot';
      snapshot: SessionSnapshot;
    }
  | {
      type: 'error';
      message: string;
    };
