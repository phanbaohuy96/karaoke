import type { Router } from 'express';
import express from 'express';
import { env } from '../config/env.js';
import { sessionStore } from '../services/sessionStore.js';

function getPublicOrigin(request: express.Request): string {
  if (env.publicOrigin) {
    return env.publicOrigin;
  }

  return `${request.protocol}://${request.get('host')}`;
}

export function createSessionRouter(): Router {
  const router = express.Router();

  router.post('/', (request, response) => {
    const session = sessionStore.createSession(getPublicOrigin(request));
    response.status(201).json(session);
  });

  router.get('/:sessionId', (request, response) => {
    const snapshot = sessionStore.getSnapshot(request.params.sessionId);

    if (!snapshot) {
      response.status(404).json({ message: 'Session not found.' });
      return;
    }

    response.json({ snapshot });
  });

  return router;
}
