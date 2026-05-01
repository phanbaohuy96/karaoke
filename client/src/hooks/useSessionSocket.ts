import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientRole, ClientSocketMessage, ConnectionStatus, ServerSocketMessage, SessionSnapshot, YouTubeSearchResult } from '../types/session';

interface UseSessionSocketOptions {
  sessionId?: string;
  role: ClientRole;
  hostToken?: string;
  enabled?: boolean;
}

function createSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

export function useSessionSocket({ sessionId, role, hostToken, enabled = true }: UseSessionSocketOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback((message: ClientSocketMessage): boolean => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError('Chưa kết nối phiên karaoke.');
      return false;
    }

    socket.send(JSON.stringify(message));
    return true;
  }, []);

  useEffect(() => {
    if (!enabled || !sessionId) {
      return;
    }

    const activeSessionId = sessionId;
    let reconnectTimer: number | undefined;
    let shouldReconnect = true;

    function connect() {
      setStatus('connecting');
      const socket = new WebSocket(createSocketUrl());
      socketRef.current = socket;

      socket.addEventListener('open', () => {
        setStatus('connected');
        setError(null);
        socket.send(
          JSON.stringify({
            type: 'join_session',
            sessionId: activeSessionId,
            role,
            hostToken,
          } satisfies ClientSocketMessage),
        );
      });

      socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data) as ServerSocketMessage;

        if (message.type === 'session_snapshot') {
          setSnapshot(message.snapshot);
          setError(null);
          return;
        }

        setError(message.message);
        setStatus('error');
      });

      socket.addEventListener('close', () => {
        setStatus('disconnected');

        if (shouldReconnect) {
          reconnectTimer = window.setTimeout(connect, 1500);
        }
      });

      socket.addEventListener('error', () => {
        setStatus('error');
        setError('Không thể kết nối phiên karaoke.');
      });
    }

    connect();

    return () => {
      shouldReconnect = false;
      window.clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [enabled, hostToken, role, sessionId]);

  const addSong = useCallback(
    (song: YouTubeSearchResult) => sendMessage({ type: 'add_song', song }),
    [sendMessage],
  );

  const removeSong = useCallback(
    (itemId: string) => sendMessage({ type: 'remove_song', itemId }),
    [sendMessage],
  );

  const setNowPlaying = useCallback(
    (itemId: string) => sendMessage({ type: 'set_now_playing', itemId }),
    [sendMessage],
  );

  const playNext = useCallback(
    () => sendMessage({ type: 'play_next' }),
    [sendMessage],
  );

  const setPlaying = useCallback(
    (isPlaying: boolean) => sendMessage({ type: 'set_playing', isPlaying }),
    [sendMessage],
  );

  return {
    snapshot,
    status,
    error,
    addSong,
    removeSong,
    setNowPlaying,
    playNext,
    setPlaying,
  };
}
