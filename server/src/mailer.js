// Outgoing email.
//
// SMTP is optional: without SMTP_HOST configured the mailer prints the message
// to the server log instead of sending it. That keeps local development
// zero-setup — you copy the reset link out of the terminal — while a real
// deployment only has to fill in the SMTP_* variables to start delivering.
//
// In production a missing SMTP_HOST is a misconfiguration, not a mode: the
// server warns loudly at boot, because a customer who never receives the email
// has no way to get back into their account.

import nodemailer from 'nodemailer';
import { isProduction } from './config.js';

const host = process.env.SMTP_HOST?.trim();
const port = Number(process.env.SMTP_PORT) || 587;
const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASS?.trim();

export const mailConfigured = Boolean(host);

const from = process.env.MAIL_FROM?.trim() || 'Rijisha Jewellers <no-reply@rijisha.in>';

// One shared connection pool, created only when SMTP is actually configured.
const transporter = mailConfigured
  ? nodemailer.createTransport({
      host,
      port,
      // 465 is implicit TLS; 587 upgrades with STARTTLS after connecting.
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    })
  : null;

export function warnIfMailUnconfigured() {
  if (!mailConfigured) {
    const where = isProduction ? 'PRODUCTION' : 'development';
    console.warn(
      `[mail] SMTP_HOST is not set — emails will be printed to this log, not sent (${where}). ` +
        'Password reset links will never reach customers until SMTP_* is configured.'
    );
  }
}

/**
 * Send one email. Never throws: a mail outage must not turn into a 500 on a
 * request the customer already completed successfully.
 * @returns {Promise<boolean>} whether the message was handed to the SMTP server
 */
export async function sendMail({ to, subject, text, html }) {
  if (!transporter) {
    console.log(
      `\n[mail] SMTP not configured — message not sent.\n  To: ${to}\n  Subject: ${subject}\n\n${text}\n`
    );
    return false;
  }
  try {
    await transporter.sendMail({ from, to, subject, text, html });
    return true;
  } catch (err) {
    console.error(`[mail] Failed to send "${subject}" to ${to}:`, err.message);
    return false;
  }
}
