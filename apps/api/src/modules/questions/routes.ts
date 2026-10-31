import { Router } from 'express';
import type { Repository } from '../../db/connection.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { questionsController } from './controller.js';
export function questionsRoutes(repository: Repository) { const router = Router(); const controller = questionsController(repository); router.use(requireAuth(repository)); router.get('/', controller.listHandler); return router; }
export function caseQuestionsRoutes(repository: Repository) { const router = Router({ mergeParams: true }); const controller = questionsController(repository); router.use(requireAuth(repository)); router.get('/', controller.listHandler); router.post('/', controller.askHandler); return router; }
