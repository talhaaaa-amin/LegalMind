import type { RequestHandler } from 'express';
import type { Repository } from '../../db/connection.js';
import { retrieve, RETRIEVAL_CONFIG_VERSION } from './service.js';

export function retrievalController(repository: Repository) {
  const evidenceHandler: RequestHandler = async (req, res, next) => {
    try {
      const caseId = typeof req.query.caseId === 'string' ? req.query.caseId : '';
      const query = typeof req.query.q === 'string' ? req.query.q : '';
      const documentIds = typeof req.query.documentIds === 'string'
        ? req.query.documentIds.split(',').filter(Boolean)
        : [];
      const workspace = await repository.read();
      if (!workspace.cases.some((item) => item.id === caseId && item.ownerId === res.locals.lawyer.id)) {
        res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Case not found or inaccessible.', requestId: res.locals.requestId } });
        return;
      }
      const chunks = await retrieve(repository, res.locals.lawyer.id, caseId, query, documentIds);
      res.json({ retrievalConfigVersion: RETRIEVAL_CONFIG_VERSION, chunks });
    } catch (error) {
      next(error);
    }
  };
  return { evidenceHandler };
}
