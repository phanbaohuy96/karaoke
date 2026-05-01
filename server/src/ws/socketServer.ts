import type { Server as HttpServer } from 'node:http';
import { nanoid } from 'nanoid';
import { WebSocket, WebSocketServer } from 'ws';
import { sessionStore } from '../services/sessionStore.js';
import type { ClientRole, SessionSnapshot } from '../types/session.js';
import type { ClientMessage, ServerMessage } from './messageTypes.js';

interface ClientState {
  clientId: string;
  sessionId?: string;
  role?: ClientRole;
}

const clientStates = new WeakMap<WebSocket, ClientState>();
const sessionSockets = new Map<string, Set<WebSocket>>();

function send(socket: WebSocket, message: ServerMessage): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function sendError(socket: WebSocket, message: string): void {
  send(socket, { type: 'error', message });
}

function broadcastSnapshot(sessionId: string, snapshot: SessionSnapshot): void {
  const sockets = sessionSockets.get(sessionId);

  if (!sockets) {
    return;
  }

  for (const socket of sockets) {
    send(socket, { type: 'session_snapshot', snapshot });
  }
}

function parseMessage(data: WebSocket.RawData): ClientMessage | undefined {
  try {
    return JSON.parse(data.toString()) as ClientMessage;
  } catch {
    return undefined;
  }
}

function leaveCurrentSession(socket: WebSocket): void {
  const state = clientStates.get(socket);

  if (!state?.sessionId) {
    return;
  }

  const sockets = sessionSockets.get(state.sessionId);
  sockets?.delete(socket);

  if (sockets?.size === 0) {
    sessionSockets.delete(state.sessionId);
  }

  const snapshot = sessionStore.unregisterClient(state.sessionId, state.clientId);

  if (snapshot) {
    broadcastSnapshot(state.sessionId, snapshot);
  }

  state.sessionId = undefined;
  state.role = undefined;
}

function handleJoin(socket: WebSocket, message: Extract<ClientMessage, { type: 'join_session' }>): void {
  const session = sessionStore.getSession(message.sessionId);

  if (!session) {
    sendError(socket, 'Session not found. Check the QR code or session code.');
    return;
  }

  const role = message.role === 'host' && message.hostToken === session.hostToken ? 'host' : 'guest';
  const state = clientStates.get(socket);

  if (!state) {
    sendError(socket, 'Client state was not initialized.');
    return;
  }

  leaveCurrentSession(socket);

  state.sessionId = session.id;
  state.role = role;

  if (!sessionSockets.has(session.id)) {
    sessionSockets.set(session.id, new Set());
  }

  sessionSockets.get(session.id)?.add(socket);

  const snapshot = sessionStore.registerClient(session.id, state.clientId, role);

  if (snapshot) {
    broadcastSnapshot(session.id, snapshot);
  }
}

function handleMessage(socket: WebSocket, message: ClientMessage): void {
  const state = clientStates.get(socket);

  if (message.type === 'join_session') {
    handleJoin(socket, message);
    return;
  }

  if (!state?.sessionId) {
    sendError(socket, 'Join a session before sending playlist actions.');
    return;
  }

  if (message.type === 'add_song') {
    const snapshot = sessionStore.addSong(state.sessionId, message.song, state.role ?? 'guest');

    if (snapshot) {
      broadcastSnapshot(state.sessionId, snapshot);
      return;
    }
  }

  if (message.type === 'remove_song') {
    const snapshot = sessionStore.removeSong(state.sessionId, message.itemId);

    if (snapshot) {
      broadcastSnapshot(state.sessionId, snapshot);
      return;
    }
  }

  if (message.type === 'set_now_playing') {
    const snapshot = sessionStore.setNowPlaying(state.sessionId, message.itemId);

    if (snapshot) {
      broadcastSnapshot(state.sessionId, snapshot);
      return;
    }
  }

  if (message.type === 'play_next') {
    const snapshot = sessionStore.playNext(state.sessionId);

    if (snapshot) {
      broadcastSnapshot(state.sessionId, snapshot);
      return;
    }
  }

  if (message.type === 'set_playing') {
    const snapshot = sessionStore.setPlaying(state.sessionId, message.isPlaying);

    if (snapshot) {
      broadcastSnapshot(state.sessionId, snapshot);
      return;
    }
  }

  if (message.type === 'set_volume') {
    const snapshot = sessionStore.setVolume(state.sessionId, message.volume);

    if (snapshot === undefined) {
      sendError(socket, 'Unable to apply playlist action.');
      return;
    }

    if (snapshot) {
      broadcastSnapshot(state.sessionId, snapshot);
    }

    return;
  }

  sendError(socket, 'Unable to apply playlist action.');
}

export function attachSocketServer(server: HttpServer): void {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket) => {
    clientStates.set(socket, { clientId: nanoid(12) });

    socket.on('message', (data) => {
      const message = parseMessage(data);

      if (!message) {
        sendError(socket, 'Invalid WebSocket message.');
        return;
      }

      handleMessage(socket, message);
    });

    socket.on('close', () => {
      leaveCurrentSession(socket);
      clientStates.delete(socket);
    });
  });
}
