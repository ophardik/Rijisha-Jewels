// Outgoing email.
//
// Three transports, tried in this order:
//
//   1. Resend's HTTPS API, when RESEND_API_KEY is set. This is what production
//      uses. Render's free instances block outbound traffic on the SMTP ports
//      (25, 465, 587), so a nodemailer connection there does not fail slowly or
//      land in spam — it never leaves the machine. Resend is reached over
//      ordinary HTTPS on port 443, which is not blocked.
//   2. SMTP via nodemailer, when SMTP_HOST is set. Kept for local development
//      against a catcher like Mailpit, and so a future move to a paid instance
//      or another host does not have to be a code change.
//   3. Neither — the message is printed to the server log. That keeps local
//      development zero-setup: you copy the reset link out of the terminal.
//
// In production, transport 3 is a misconfiguration rather than a mode. The
// server warns loudly at boot, because a customer who never receives the email
// has no way back into their account.

import nodemailer from 'nodemailer';
import { isProduction } from './config.js';

const resendKey = process.env.RESEND_API_KEY?.trim();
const host = process.env.SMTP_HOST?.trim();
const port = Number(process.env.SMTP_PORT) || 587;
const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASS?.trim();

// Resend wins when both are configured, so that setting SMTP_* for a local
// experiment cannot silently divert production mail.
const transport = resendKey ? 'resend' : host ? 'smtp' : 'log';

export const mailConfigured = transport !== 'log';

// Resend will only accept a From address on a domain verified in the account.
// An unverified sender is rejected at the API with a 403, which sendMail logs.
const from = process.env.MAIL_FROM?.trim() || 'Rijisha Jewellers <no-reply@rijisha.com>';

// One shared connection pool, created only when SMTP is the chosen transport.
const transporter =
  transport === 'smtp'
    ? nodemailer.createTransport({
        host,
        port,
        // 465 is implicit TLS; 587 upgrades with STARTTLS after connecting.
        secure: port === 465,
        auth: user ? { user, pass } : undefined,
      })
    : null;

export function warnIfMailUnconfigured() {
  if (transport === 'log') {
    const where = isProduction ? 'PRODUCTION' : 'development';
    console.warn(
      `[mail] Neither RESEND_API_KEY nor SMTP_HOST is set — emails will be printed to this log, not sent (${where}). ` +
        'Password reset links will never reach customers until one of them is configured.'
    );
    return;
  }

  if (transport === 'smtp' && isProduction) {
    console.warn(
      '[mail] Sending over SMTP in production. Render free instances block ports 25/465/587, ' +
        'so this silently delivers nothing there — set RESEND_API_KEY instead, or use a paid instance type.'
    );
  }
}

/**
 * Hand one message to Resend over HTTPS.
 * @returns {Promise<boolean>} whether Resend accepted it
 */
async function sendViaResend({ to, subject, text, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    // `to` is an array in Resend's API even for a single recipient.
    body: JSON.stringify({ from, to: [to], subject, text, ...(html ? { html } : {}) }),
  });

  if (res.ok) return true;

  // Resend explains refusals (unverified domain, malformed From) in the body,
  // and that text is the whole diagnosis — a bare status code is not actionable.
  const detail = await res.text().catch(() => '');
  console.error(`[mail] Resend rejected "${subject}" for ${to}: ${res.status} ${detail}`);
  return false;
}

/**
 * Send one email. Never throws: a mail outage must not turn into a 500 on a
 * request the customer already completed successfully.
 * @returns {Promise<boolean>} whether the message was accepted for delivery
 */
export async function sendMail({ to, subject, text, html }) {
  if (transport === 'log') {
    console.log(
      `\n[mail] No mail transport configured — message not sent.\n  To: ${to}\n  Subject: ${subject}\n\n${text}\n`
    );
    return false;
  }

  try {
    if (transport === 'resend') return await sendViaResend({ to, subject, text, html });
    await transporter.sendMail({ from, to, subject, text, html });
    return true;
  } catch (err) {
    console.error(`[mail] Failed to send "${subject}" to ${to}:`, err.message);
    return false;
  }
}
