import { createApp } from './app.js';
import { connectStorage } from './db/connection.js';
import { env } from './config/env.js';
import { startDocumentWorker } from './worker/documentWorker.js';

const repository = await connectStorage();
const app = createApp(repository);
const stopDocumentWorker = startDocumentWorker(repository);

const server = app.listen(env.PORT, () => {
  console.log(`LegalMind API listening on http://127.0.0.1:${env.PORT} (${repository.mode})`);
});

function shutdown() {
  stopDocumentWorker();
  server.close(() => process.exit(0));
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
