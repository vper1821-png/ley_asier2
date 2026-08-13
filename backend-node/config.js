import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

if (!process.env.JWT_SECRET) {
  console.warn('[SECURITY] JWT_SECRET not set in .env — using auto-generated random key. Tokens will not survive restarts.');
}

export const CONFIG = {
  PORT: parseInt(process.env.PORT) || 3838,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  REPORTS_DIR: 'reports',
  OTP_EXPIRY_MINUTES: 10,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  API_BASE_URL: process.env.API_BASE_URL || `http://localhost:${parseInt(process.env.PORT) || 3838}`,
  OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://localhost:11434',
  AI_MODEL: process.env.AI_MODEL || 'mistral',
  SIGN_CERT_PATH: process.env.SIGN_CERT_PATH || path.resolve(__dirname, '../certificates/securelab.pfx'),
  SIGN_CERT_PASSWORD: process.env.SIGN_CERT_PASSWORD,
};
