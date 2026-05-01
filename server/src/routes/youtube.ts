import type { Router } from 'express';
import express from 'express';
import { env } from '../config/env.js';
import { searchYouTube, YouTubeApiError } from '../services/youtubeService.js';

export function createYouTubeRouter(): Router {
  const router = express.Router();

  router.get('/search', async (request, response) => {
    const query = typeof request.query.q === 'string' ? request.query.q : '';

    try {
      const results = await searchYouTube(env.youtubeApiKey, query);
      response.json({ results });
    } catch (error) {
      if (error instanceof YouTubeApiError) {
        response.status(error.statusCode).json({ message: error.message });
        return;
      }

      response.status(500).json({ message: 'Có lỗi khi tìm kiếm YouTube.' });
    }
  });

  return router;
}
