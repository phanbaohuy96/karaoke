import { customAlphabet, nanoid } from 'nanoid';
import type { ClientRole, CreateSessionResult, KaraokeSession, PlaylistItem, SessionSnapshot, YouTubeSearchResult } from '../types/session.js';

const createSessionId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);
const sessions = new Map<string, KaraokeSession>();

function toSnapshot(session: KaraokeSession): SessionSnapshot {
  return {
    id: session.id,
    createdAt: session.createdAt,
    joinUrl: session.joinUrl,
    playlist: session.playlist,
    nowPlaying: session.nowPlaying,
    isPlaying: session.isPlaying,
    clientCount: session.clients.size,
  };
}

function createUniqueSessionId(): string {
  let sessionId = createSessionId();

  while (sessions.has(sessionId)) {
    sessionId = createSessionId();
  }

  return sessionId;
}

export const sessionStore = {
  createSession(publicOrigin: string): CreateSessionResult {
    const sessionId = createUniqueSessionId();
    const joinUrl = `${publicOrigin.replace(/\/$/, '')}/join/${sessionId}`;
    const session: KaraokeSession = {
      id: sessionId,
      hostToken: nanoid(32),
      createdAt: Date.now(),
      joinUrl,
      playlist: [],
      nowPlaying: null,
      isPlaying: false,
      clients: new Map(),
    };

    sessions.set(sessionId, session);

    return {
      sessionId,
      hostToken: session.hostToken,
      joinUrl,
      snapshot: toSnapshot(session),
    };
  },

  getSession(sessionId: string): KaraokeSession | undefined {
    return sessions.get(sessionId.toUpperCase());
  },

  getSnapshot(sessionId: string): SessionSnapshot | undefined {
    const session = this.getSession(sessionId);
    return session ? toSnapshot(session) : undefined;
  },

  registerClient(sessionId: string, clientId: string, role: ClientRole): SessionSnapshot | undefined {
    const session = this.getSession(sessionId);

    if (!session) {
      return undefined;
    }

    session.clients.set(clientId, { clientId, role });

    if (role === 'host') {
      session.hostClientId = clientId;
    }

    return toSnapshot(session);
  },

  unregisterClient(sessionId: string, clientId: string): SessionSnapshot | undefined {
    const session = this.getSession(sessionId);

    if (!session) {
      return undefined;
    }

    session.clients.delete(clientId);

    if (session.hostClientId === clientId) {
      session.hostClientId = undefined;
    }

    return toSnapshot(session);
  },

  addSong(sessionId: string, song: YouTubeSearchResult, requestedBy: ClientRole): SessionSnapshot | undefined {
    const session = this.getSession(sessionId);

    if (!session) {
      return undefined;
    }

    const playlistItem: PlaylistItem = {
      id: nanoid(10),
      videoId: song.videoId,
      title: song.title,
      channelTitle: song.channelTitle,
      thumbnailUrl: song.thumbnailUrl,
      requestedBy,
      addedAt: Date.now(),
    };

    session.playlist.push(playlistItem);

    return toSnapshot(session);
  },

  removeSong(sessionId: string, itemId: string): SessionSnapshot | undefined {
    const session = this.getSession(sessionId);

    if (!session) {
      return undefined;
    }

    const itemIndex = session.playlist.findIndex((item) => item.id === itemId);

    if (itemIndex >= 0) {
      session.playlist.splice(itemIndex, 1);
    }

    return toSnapshot(session);
  },

  setNowPlaying(sessionId: string, itemId: string): SessionSnapshot | undefined {
    const session = this.getSession(sessionId);

    if (!session) {
      return undefined;
    }

    const itemIndex = session.playlist.findIndex((playlistItem) => playlistItem.id === itemId);

    if (itemIndex < 0) {
      return toSnapshot(session);
    }

    const [item] = session.playlist.splice(itemIndex, 1);
    session.nowPlaying = item;
    session.isPlaying = true;

    return toSnapshot(session);
  },

  playNext(sessionId: string): SessionSnapshot | undefined {
    const session = this.getSession(sessionId);

    if (!session) {
      return undefined;
    }

    const [nextSong] = session.playlist.splice(0, 1);
    session.nowPlaying = nextSong ?? null;
    session.isPlaying = Boolean(session.nowPlaying);

    return toSnapshot(session);
  },

  setPlaying(sessionId: string, isPlaying: boolean): SessionSnapshot | undefined {
    const session = this.getSession(sessionId);

    if (!session) {
      return undefined;
    }

    session.isPlaying = Boolean(session.nowPlaying) && isPlaying;

    return toSnapshot(session);
  },
};
