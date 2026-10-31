import { Router } from 'express';
import type { Repository } from '../../db/connection.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { documentsController } from './controller.js';

export function documentsRoutes(repository: Repository) {
  const router = Router();
  const controller = documentsController(repository);
  router.use(requireAuth(repository));
  router.get('/', controller.listHandler);
  router.get('/:id/status', controller.statusHandler);
  router.patch('/:id/status', controller.updateHandler);
  router.post('/:id/retry', controller.retryHandler);
  router.get('/:id/source', controller.sourceHandler);
  router.delete('/:id', controller.deleteHandler);
  return router;
}

export function caseDocumentsRoutes(repository: Repository) {
  const router = Router({ mergeParams: true });
  const controller = documentsController(repository);
  router.use(requireAuth(repository));
  router.get('/', controller.listHandler);
  router.post('/', controller.uploadHandler);
  return router;
}
