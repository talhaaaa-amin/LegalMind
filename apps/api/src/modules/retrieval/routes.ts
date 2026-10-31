import { Router } from 'express';
import type { Repository } from '../../db/connection.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { retrievalController } from './controller.js';

export function retrievalRoutes(repository: Repository) {
  const router = Router();
  router.use(requireAuth(repository));
  router.get('/evidence', retrievalController(repository).evidenceHandler);
  return router;
}
