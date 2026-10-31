import type { RequestHandler } from 'express';
import type { Repository } from '../../db/connection.js';
import { deleteSavedAnswer, listSavedAnswers, saveAnswer } from './service.js';
function param(req: Parameters<RequestHandler>[0], name: string) { return typeof req.params[name] === 'string' ? req.params[name] : ''; }
export function savedAnswersController(repository: Repository) {
  const listHandler: RequestHandler = async (req, res, next) => { try { const caseId = typeof req.query.caseId === 'string' ? req.query.caseId : ''; res.json({ savedAnswers: await listSavedAnswers(repository, res.locals.lawyer.id, caseId) }); } catch (error) { next(error); } };
  const createHandler: RequestHandler = async (req, res, next) => { try { res.status(201).json({ savedAnswer: await saveAnswer(repository, res.locals.lawyer.id, param(req, 'caseId'), req.body ?? {}) }); } catch (error) { next(error); } };
  const deleteHandler: RequestHandler = async (req, res, next) => { try { await deleteSavedAnswer(repository, res.locals.lawyer.id, param(req, 'id')); res.json({ ok: true }); } catch (error) { next(error); } };
  return { listHandler, createHandler, deleteHandler };
}
