import type { CreateSessionResponse, SessionSnapshot } from '../types/session';

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message ?? 'Request failed.');
  }

  return payload as T;
}

export async function createSession(): Promise<CreateSessionResponse> {
  const response = await fetch('/api/sessions', { method: 'POST' });
  return readJsonResponse<CreateSessionResponse>(response);
}

export async function getSession(sessionId: string): Promise<SessionSnapshot> {
  const response = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}`);
  const payload = await readJsonResponse<{ snapshot: SessionSnapshot }>(response);
  return payload.snapshot;
}
