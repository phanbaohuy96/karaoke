import dotenv from 'dotenv';

dotenv.config();

const parsedPort = Number(process.env.PORT ?? '3001');

export const env = {
  port: Number.isFinite(parsedPort) ? parsedPort : 3001,
  publicOrigin: process.env.APP_PUBLIC_ORIGIN?.trim().replace(/\/$/, '') || undefined,
  youtubeApiKey: process.env.YOUTUBE_API_KEY?.trim() || '',
  nodeEnv: process.env.NODE_ENV ?? 'development',
};
