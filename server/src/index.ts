import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { env } from './config/env.js';
import { createSessionRouter } from './routes/sessions.js';
import { createYouTubeRouter } from './routes/youtube.js';
import { attachSocketServer } from './ws/socketServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.use('/api/sessions', createSessionRouter());
app.use('/api/youtube', createYouTubeRouter());

if (env.nodeEnv === 'production') {
  const clientDist = path.resolve(process.cwd(), 'dist/client');
  app.use(express.static(clientDist));
  app.use((request, response, next) => {
    if (request.method !== 'GET') {
      next();
      return;
    }

    response.sendFile(path.join(clientDist, 'index.html'));
  });
}

const server = http.createServer(app);
attachSocketServer(server);

server.listen(env.port, '0.0.0.0', () => {
  console.log(`Karaoke server listening on http://localhost:${env.port}`);
});
