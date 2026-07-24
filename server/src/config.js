// Environment configuration and boot-time validation.
//
// The rule here: in production, a missing secret must stop the server. Silent
// fallbacks (a default admin password, an embedded throwaway database) look
// like a healthy deploy while quietly losing data or handing out admin access.

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const isProduction = process.env.NODE_ENV === 'production';

// Where customer review photos live. Configurable so a deploy can point it at a
// mounted disk outside the app directory — inside it, a redeploy wipes them.
export const uploadDir = process.env.UPLOAD_DIR?.trim()
  ? path.resolve(process.env.UPLOAD_DIR.trim())
  : path.join(__dirname, '..', 'uploads');

// Everything the API cannot safely run without once it is serving real customers
const REQUIRED_IN_PRODUCTION = [
  'MONGO_URI', // without it, db.js would start a throwaway embedded MongoDB
  'JWT_SECRET', // without it, jwt.sign throws on every login
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
];

export function validateEnv() {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]?.trim());

  if (isProduction && missing.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missing.join(', ')}. ` +
        'Set them in your host dashboard (Render → Environment) and redeploy.'
    );
  }

  if (!isProduction && missing.length > 0) {
    console.warn(`Running in development without: ${missing.join(', ')}`);
  }
}
