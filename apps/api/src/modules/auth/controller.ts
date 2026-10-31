import type { RequestHandler } from 'express';
import { AppError } from '../../errors/AppError.js';
import { demoLogin, login, logout, register } from './service.js';
import type { Repository } from '../../db/connection.js';

const COOKIE = 'legalmind_session';
const attempts = new Map<string, { count: number; resetAt: number }>();

function setSessionCookie(res: Parameters<RequestHandler>[1], token: string) {
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800`);
}

function bodyString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function rateLimit(req: Parameters<RequestHandler>[0]) {
  const key = req.ip ?? 'unknown';
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 60000 });
    return;
  }
  current.count += 1;
  if (current.count > 10) throw new AppError(429, 'RATE_LIMITED', 'Too many login attempts. Please try again later.');
}

export function authController(repository: Repository) {
  const registerHandler: RequestHandler = async (req, res, next) => {
    try {
      const result = await register(repository, bodyString(req.body?.name), bodyString(req.body?.email), bodyString(req.body?.password));
      setSessionCookie(res, result.token);
      res.status(201).json(result);
    } catch (error) { next(error); }
  };

  const loginHandler: RequestHandler = async (req, res, next) => {
    try {
      rateLimit(req);
      const result = await login(repository, bodyString(req.body?.email), bodyString(req.body?.password));
      setSessionCookie(res, result.token);
      res.json(result);
    } catch (error) { next(error); }
  };

  const demoLoginHandler: RequestHandler = async (req, res, next) => {
    try {
      const lawyerId = req.body?.lawyerId;
      if (lawyerId !== 'lawyer-1' && lawyerId !== 'lawyer-2') {
        throw new AppError(400, 'INVALID_INPUT', 'lawyerId must be lawyer-1 or lawyer-2.');
      }
      const result = await demoLogin(repository, lawyerId);
      setSessionCookie(res, result.token);
      res.json(result);
    } catch (error) { next(error); }
  };

  const logoutHandler: RequestHandler = async (req, res, next) => {
    try {
      const token = res.locals.sessionToken as string | undefined;
      if (token) await logout(repository, token);
      res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
      res.json({ ok: true });
    } catch (error) { next(error); }
  };

  const meHandler: RequestHandler = (_req, res) => res.json({ lawyer: res.locals.lawyer });
  return { registerHandler, loginHandler, demoLoginHandler, logoutHandler, meHandler };
}
