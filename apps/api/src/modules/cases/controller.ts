import type { RequestHandler } from 'express';
import type { Repository } from '../../db/connection.js';
import { AppError } from '../../errors/AppError.js';
import { createCase, getCase, listCases, setCaseArchived, updateCase } from './service.js';

function ownerId(res: Parameters<RequestHandler>[1]): string {
  const id = res.locals.lawyer?.id;
  if (typeof id !== 'string') throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
  return id;
}

function caseId(req: Parameters<RequestHandler>[0]): string {
  return typeof req.params.id === 'string' ? req.params.id : '';
}

export function casesController(repository: Repository) {
  const listHandler: RequestHandler = async (req, res, next) => {
    try {
      const archived = req.query.archived;
      const includeArchived = archived === 'true';
      res.json({ cases: await listCases(repository, ownerId(res), includeArchived) });
    } catch (error) { next(error); }
  };

  const createHandler: RequestHandler = async (req, res, next) => {
    try {
      const caseItem = await createCase(repository, ownerId(res), {
        title: req.body?.title,
        description: req.body?.description,
      });
      res.status(201).json({ case: caseItem });
    } catch (error) { next(error); }
  };

  const getHandler: RequestHandler = async (req, res, next) => {
    try {
      res.json({ case: await getCase(repository, ownerId(res), caseId(req)) });
    } catch (error) { next(error); }
  };

  const updateHandler: RequestHandler = async (req, res, next) => {
    try {
      const caseItem = await updateCase(repository, ownerId(res), caseId(req), {
        title: req.body?.title,
        description: req.body?.description,
      });
      res.json({ case: caseItem });
    } catch (error) { next(error); }
  };

  const archiveHandler: RequestHandler = async (req, res, next) => {
    try {
      const caseItem = await setCaseArchived(repository, ownerId(res), caseId(req), req.body?.archived);
      res.json({ case: caseItem });
    } catch (error) { next(error); }
  };

  return { listHandler, createHandler, getHandler, updateHandler, archiveHandler };
}
