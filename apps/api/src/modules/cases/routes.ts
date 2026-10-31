import { Router } from 'express';
import type { Repository } from '../../db/connection.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { casesController } from './controller.js';
import { caseDocumentsRoutes } from '../documents/routes.js';
import { caseQuestionsRoutes } from '../questions/routes.js';
import { caseSavedAnswersRoutes } from '../savedAnswers/routes.js';

export function casesRoutes(repository: Repository) {
  const router = Router();
  const controller = casesController(repository);
  router.use(requireAuth(repository));
  router.use('/:caseId/documents', caseDocumentsRoutes(repository));
  router.use('/:caseId/questions', caseQuestionsRoutes(repository));
  router.use('/:caseId/saved-answers', caseSavedAnswersRoutes(repository));
  router.get('/', controller.listHandler);
  router.post('/', controller.createHandler);
  router.get('/:id', controller.getHandler);
  router.patch('/:id', controller.updateHandler);
  router.patch('/:id/archive', controller.archiveHandler);
  return router;
}
