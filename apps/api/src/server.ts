import { createApp } from './app.js';
import { connectStorage } from './db/connection.js';
import { env } from './config/env.js';

const repository = await connectStorage();
const app = createApp(repository);

app.listen(env.PORT, () => {
  console.log(`LegalMind API listening on http://127.0.0.1:${env.PORT} (${repository.mode})`);
});
