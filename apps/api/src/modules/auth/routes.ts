import { Router } from 'express';
import type { Repository } from '../../db/connection.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { authController } from './controller.js';

export function authRoutes(repository: Repository) {
  const router = Router();
  const controller = authController(repository);
  router.post('/register', controller.registerHandler);
  router.post('/login', controller.loginHandler);
  router.post('/demo-login', controller.demoLoginHandler);
  router.post('/logout', requireAuth(repository), controller.logoutHandler);
  router.get('/me', requireAuth(repository), controller.meHandler);
  return router;
}
