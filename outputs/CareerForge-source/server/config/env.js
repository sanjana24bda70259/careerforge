import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const directory = dirname(fileURLToPath(import.meta.url));
// Keep the application configuration in the repository root regardless of how
// the server is started (`npm --prefix server` or `node server/server.js`).
dotenv.config({ path: resolve(directory, '../../.env') });
dotenv.config({ path: resolve(directory, '../.env'), override: false });
