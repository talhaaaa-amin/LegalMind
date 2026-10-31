import { Router } from 'express';
import type { Repository } from '../../db/connection.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { listQuestions } from '../questions/service.js';

export function conversationsRoutes(repository: Repository) {
  const router = Router();
  router.use(requireAuth(repository));
  router.get('/', async (req, res, next) => {
    try {
      const caseId = typeof req.query.caseId === 'string' ? req.query.caseId : '';
      res.json({ responses: await listQuestions(repository, res.locals.lawyer.id, caseId) });
    } catch (error) {
      next(error);
    }
  });
  return router;
}

export function caseConversationsRoutes(repository: Repository) {
  const router = Router({ mergeParams: true });
  router.use(requireAuth(repository));
  router.get('/', async (req, res, next) => {
    try {
      const params = req.params as Record<string, string | string[] | undefined>;
      const caseId = typeof params.caseId === 'string' ? params.caseId : '';
      res.json({ responses: await listQuestions(repository, res.locals.lawyer.id, caseId) });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
