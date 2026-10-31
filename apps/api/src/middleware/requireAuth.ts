import type { RequestHandler } from 'express';
import type { Repository } from '../db/connection.js';
import { AppError } from '../errors/AppError.js';
import { getLawyerByToken } from '../modules/auth/service.js';

function getToken(req: Parameters<RequestHandler>[0]): string | null {
  const authorization = req.header('authorization');
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7).trim();
  const cookies = req.header('cookie')?.split(';').map((item) => item.trim()) ?? [];
  return cookies.find((cookie) => cookie.startsWith('legalmind_session='))?.split('=').slice(1).join('=') ?? null;
}

export function requireAuth(repository: Repository): RequestHandler {
  return async (req, res, next) => {
    try {
      const token = getToken(req);
      const lawyer = token ? await getLawyerByToken(repository, token) : null;
      if (!lawyer) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
      res.locals.lawyer = lawyer;
      res.locals.sessionToken = token;
      next();
    } catch (error) {
      next(error);
    }
  };
}
