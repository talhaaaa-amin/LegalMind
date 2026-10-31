import type { RequestHandler } from 'express';
import type { Repository } from '../../db/connection.js';
import { listDocuments, uploadDocument, getStatus, updateStatus, retry, source, remove } from './service.js';

function ownerId(res: Parameters<RequestHandler>[1]) { return res.locals.lawyer.id as string; }
function param(req: Parameters<RequestHandler>[0], name: string) {
  return typeof req.params[name] === 'string' ? req.params[name] : '';
}

export function documentsController(repository: Repository) {
  const listHandler: RequestHandler = async (req, res, next) => {
    try { res.json({ documents: await listDocuments(repository, ownerId(res), typeof req.query.caseId === 'string' ? req.query.caseId : undefined) }); } catch (error) { next(error); }
  };
  const uploadHandler: RequestHandler = async (req, res, next) => {
    try {
      const result = await uploadDocument(repository, ownerId(res), param(req, 'caseId'), req.body ?? {});
      res.status(202).json({ document: result.document, jobId: result.job.id });
    } catch (error) { next(error); }
  };
  const statusHandler: RequestHandler = async (req, res, next) => {
    try { res.json(await getStatus(repository, ownerId(res), param(req, 'id'))); } catch (error) { next(error); }
  };
  const updateHandler: RequestHandler = async (req, res, next) => {
    try { res.json({ document: await updateStatus(repository, ownerId(res), param(req, 'id'), req.body?.status, req.body?.errorCode) }); } catch (error) { next(error); }
  };
  const retryHandler: RequestHandler = async (req, res, next) => {
    try { res.json({ document: await retry(repository, ownerId(res), param(req, 'id')) }); } catch (error) { next(error); }
  };
  const sourceHandler: RequestHandler = async (req, res, next) => {
    try { res.json(await source(repository, ownerId(res), param(req, 'id'), Number(req.query.page ?? 1))); } catch (error) { next(error); }
  };
  const deleteHandler: RequestHandler = async (req, res, next) => {
    try { const documentId = param(req, 'id'); await remove(repository, ownerId(res), documentId); res.status(202).json({ ok: true, documentId }); } catch (error) { next(error); }
  };
  return { listHandler, uploadHandler, statusHandler, updateHandler, retryHandler, sourceHandler, deleteHandler };
}
