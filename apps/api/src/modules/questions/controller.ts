import type { RequestHandler } from 'express';
import type { Repository } from '../../db/connection.js';
import { askQuestion, listQuestions } from './service.js';

function param(req: Parameters<RequestHandler>[0], name: string) { return typeof req.params[name] === 'string' ? req.params[name] : ''; }
export function questionsController(repository: Repository) {
  const listHandler: RequestHandler = async (req, res, next) => { try { const caseId = typeof req.query.caseId === 'string' ? req.query.caseId : ''; res.json({ responses: await listQuestions(repository, res.locals.lawyer.id, caseId) }); } catch (error) { next(error); } };
  const askHandler: RequestHandler = async (req, res, next) => { try { res.json({ response: await askQuestion(repository, res.locals.lawyer.id, param(req, 'caseId'), req.body ?? {}) }); } catch (error) { next(error); } };
  return { listHandler, askHandler };
}
