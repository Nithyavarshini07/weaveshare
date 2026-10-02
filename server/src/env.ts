import dns from 'node:dns';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverEnvPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: serverEnvPath });

if (!process.env.MONGODB_URI) {
  console.error(`❌ MONGODB_URI is not defined. Expected it in: ${serverEnvPath}`);
  process.exit(1);
}