import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import type { Repository } from './db/connection.js';
import { authRoutes } from './modules/auth/routes.js';
import { casesRoutes } from './modules/cases/routes.js';
import { documentsRoutes } from './modules/documents/routes.js';
import { questionsRoutes } from './modules/questions/routes.js';
import { savedAnswersRoutes } from './modules/savedAnswers/routes.js';

export function createApp(repository: Repository) {
  const app = express();
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(requestId);

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'legalmind-api',
      requestId: res.locals.requestId,
      storageMode: repository.mode,
    });
  });
  app.use('/api/auth', authRoutes(repository));
  app.use('/api/cases', casesRoutes(repository));
  app.use('/api/documents', documentsRoutes(repository));
  app.use('/api/questions', questionsRoutes(repository));
  app.use('/api/saved-answers', savedAnswersRoutes(repository));

  app.use(errorHandler);
  return app;
}
