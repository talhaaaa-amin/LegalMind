import { Router } from 'express';
import type { Repository } from '../../db/connection.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { savedAnswersController } from './controller.js';
export function savedAnswersRoutes(repository: Repository) { const router = Router(); const controller = savedAnswersController(repository); router.use(requireAuth(repository)); router.get('/', controller.listHandler); router.delete('/:id', controller.deleteHandler); return router; }
export function caseSavedAnswersRoutes(repository: Repository) { const router = Router({ mergeParams: true }); const controller = savedAnswersController(repository); router.use(requireAuth(repository)); router.get('/', controller.listHandler); router.post('/', controller.createHandler); return router; }
