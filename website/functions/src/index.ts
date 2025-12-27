import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import express, { Request, Response, NextFunction } from 'express';
import appsRouter from './routes/apps.js';
import buildsRouter from './routes/builds.js';
import usersRouter from './routes/users.js';

initializeApp();

const app = express();

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'http://localhost:5900',
    'https://native-update.web.app',
    'https://native-update.firebaseapp.com',
  ];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).send();
    return;
  }

  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Firebase Functions API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/apps', appsRouter);
app.use('/builds', buildsRouter);
app.use('/users', usersRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

export const api = onRequest(
  {
    region: 'us-central1',
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: '256MiB',
    cors: true,
  },
  app
);
