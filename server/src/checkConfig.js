// Answers "is this thing actually connected?" for every external service.
//
//   npm run check
//
// Each check performs a real network round trip rather than only looking for a
// non-empty environment variable — a wrong password and a missing one both
// leave the variable set, and only one of them is visible from the config.
//
// Exits non-zero if anything fails, so it can gate a deploy.

import 'dotenv/config';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { v2 as cloudinary } from 'cloudinary';

const results = [];
const record = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  OK  ' : ' FAIL '} ${name.padEnd(12)} ${detail}`);
};

async function checkMongo() {
  const uri = process.env.MONGO_URI?.trim();
  if (!uri) return record('MongoDB', false, 'MONGO_URI is not set');

  const dbName = /^mongodb(?:\+srv)?:\/\/[^/]*\/([^?]*)/.exec(uri)?.[1];
  if (!dbName) {
    return record('MongoDB', false, 'connection string has no database name after the host');
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    const products = await mongoose.connection.db.collection('products').countDocuments();
    record('MongoDB', true, `database "${mongoose.connection.name}", ${products} products`);
    await mongoose.disconnect();
  } catch (err) {
    record('MongoDB', false, err.message);
  }
}

async function checkCloudinary() {
  const { CLOUDINARY_CLOUD_NAME: name, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env;
  if (!name?.trim() || !key?.trim() || !secret?.trim()) {
    return record('Cloudinary', false, 'not configured — uploads will stay on disk and die on redeploy');
  }
  cloudinary.config({ cloud_name: name.trim(), api_key: key.trim(), api_secret: secret.trim(), secure: true });
  try {
    await cloudinary.api.ping();
    const usage = await cloudinary.api.usage().catch(() => null);
    const used = usage?.credits?.usage ?? null;
    const limit = usage?.credits?.limit ?? null;
    const quota = used !== null && limit !== null ? `, ${used}/${limit} credits used` : '';
    record('Cloudinary', true, `cloud "${name.trim()}"${quota}`);
  } catch (err) {
    record('Cloudinary', false, err.message);
  }
}

async function checkSmtp() {
  // Mirrors the transport precedence in mailer.js: Resend first, SMTP second.
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    try {
      // Cheapest authenticated call Resend offers — proves the key is live
      // without sending anything to a real inbox.
      const res = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${resendKey}` },
      });
      if (res.ok) record('Resend', true, 'API key accepted — password reset emails will send over HTTPS');
      else record('Resend', false, `API key rejected (${res.status}) — ${await res.text().catch(() => '')}`);
    } catch (err) {
      record('Resend', false, err.message);
    }
    return;
  }

  const host = process.env.SMTP_HOST?.trim();
  if (!host)
    return record(
      'Mail',
      false,
      'neither RESEND_API_KEY nor SMTP_HOST is set — password reset emails are only logged, not sent'
    );

  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER?.trim();
  try {
    await nodemailer
      .createTransport({ host, port, secure: port === 465, auth: user ? { user, pass: process.env.SMTP_PASS } : undefined })
      .verify();
    record('SMTP', true, `${host}:${port} accepted the credentials`);
  } catch (err) {
    record('SMTP', false, err.message);
  }
}

function checkPublicUrl() {
  const url = process.env.PUBLIC_URL?.trim() || process.env.CLIENT_ORIGIN?.split(',')[0]?.trim();
  if (!url) return record('PUBLIC_URL', false, 'not set — password reset links would have no origin');
  if (!/^https?:\/\//.test(url)) return record('PUBLIC_URL', false, `"${url}" is missing http:// or https://`);
  record('PUBLIC_URL', true, `reset links will point at ${url.replace(/\/+$/, '')}`);
}

console.log(`\nChecking services (NODE_ENV=${process.env.NODE_ENV || 'development'})\n`);

checkPublicUrl();
await checkMongo();
await checkCloudinary();
await checkSmtp();

const failed = results.filter((r) => !r.ok);
console.log(
  failed.length ? `\n${failed.length} check(s) failed: ${failed.map((f) => f.name).join(', ')}\n` : '\nAll checks passed.\n'
);
process.exit(failed.length ? 1 : 0);
