// Branded HTML for outgoing email.
//
// Email clients are not browsers. There is no shared stylesheet, <style> blocks
// are unreliable (Gmail strips them in some contexts), webfonts are blocked by
// Gmail and Outlook, and Outlook renders through Word — which ignores flexbox,
// grid, and most modern CSS. So everything here is tables with inline styles,
// which is genuinely how production email is still built.
//
// The palette mirrors client/src/index.css so an email looks like it came from
// the same shop as the site. Cormorant Garamond cannot load, so the display
// face falls back to Georgia — the nearest widely-installed serif.

const INK = '#1c1c1e';
const SOFT_INK = '#4c4c50';
const MUTED = '#8a8a90';
const ACCENT = '#9a7b4f';
const IVORY = '#faf8f4';
const LINE = '#e4dfd6';
const WHITE = '#ffffff';

const DISPLAY = "Georgia, 'Cormorant Garamond', 'Times New Roman', serif";
const BODY = "'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const BRAND = 'Rijisha Jewellers';
const TAGLINE = 'Handcrafted 925 Silver';

/** Text from the database (a customer's name) must never become markup. */
const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Wrap body markup in the shop's letterhead.
 * @param {{preheader: string, heading: string, body: string}} parts
 *   preheader — the grey line inboxes show next to the subject
 *   heading   — serif headline inside the card
 *   body      — already-escaped HTML for the message area
 */
function layout({ preheader, heading, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0; padding:0; background-color:${IVORY}; -webkit-font-smoothing:antialiased;">

<!-- Preview line: shown in the inbox list, hidden in the message itself. The
     trailing spaces stop the client pulling body text in after it. -->
<div style="display:none; font-size:1px; color:${IVORY}; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
  ${escapeHtml(preheader)}${'&nbsp;&zwnj;'.repeat(60)}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${IVORY};">
<tr>
<td align="center" style="padding:32px 16px 40px 16px;">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">

    <!-- Letterhead -->
    <tr>
      <td align="center" style="padding:12px 0 26px 0;">
        <div style="font-family:${DISPLAY}; font-size:30px; line-height:36px; letter-spacing:6px; color:${INK}; text-transform:uppercase;">
          Rijisha
        </div>
        <div style="font-family:${BODY}; font-size:10px; line-height:16px; letter-spacing:4px; color:${ACCENT}; text-transform:uppercase; padding-top:6px;">
          ${TAGLINE}
        </div>
      </td>
    </tr>

    <!-- Card -->
    <tr>
      <td style="background-color:${WHITE}; border:1px solid ${LINE}; border-radius:14px; padding:44px 44px 38px 44px;">

        <div style="font-family:${DISPLAY}; font-size:27px; line-height:34px; color:${INK}; font-weight:normal;">
          ${escapeHtml(heading)}
        </div>

        <!-- Hairline with a small mark, in place of an image divider -->
        <div style="font-family:${BODY}; font-size:11px; line-height:14px; color:${ACCENT}; letter-spacing:3px; padding:14px 0 4px 0;">
          &#9670;
        </div>

        ${body}

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td align="center" style="padding:26px 24px 0 24px;">
        <div style="font-family:${BODY}; font-size:12px; line-height:20px; color:${MUTED};">
          ${BRAND} &nbsp;&middot;&nbsp; ${TAGLINE}
        </div>
        <div style="font-family:${BODY}; font-size:11px; line-height:18px; color:${MUTED}; padding-top:8px;">
          This message was sent automatically — replies to it are not monitored.
        </div>
      </td>
    </tr>

  </table>

</td>
</tr>
</table>

</body>
</html>`;
}

/** A centred call-to-action. Built from a table so Outlook renders the fill. */
function button(label, href) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
  <tr>
    <td align="center" bgcolor="${ACCENT}" style="background-color:${ACCENT}; border-radius:6px;">
      <a href="${escapeHtml(href)}"
         style="display:inline-block; padding:15px 42px; font-family:${BODY}; font-size:14px; line-height:18px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:${WHITE}; text-decoration:none; border-radius:6px;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

const paragraph = (html, extra = '') =>
  `<p style="margin:0 0 16px 0; font-family:${BODY}; font-size:15px; line-height:26px; color:${SOFT_INK};${extra}">${html}</p>`;

/**
 * The password reset message.
 * @param {string} name customer's first name, unescaped
 * @param {string} link one-time reset URL
 * @param {number} hours how long the link stays valid
 */
export function resetPasswordEmail(name, link, hours = 1) {
  const safeName = escapeHtml(name);
  const window = hours === 1 ? 'one hour' : `${hours} hours`;

  const body = `
        ${paragraph(`Hello ${safeName},`, ' padding-top:10px;')}
        ${paragraph(
          `We received a request to reset the password for your ${BRAND} account. ` +
            `Choose a new one using the button below.`
        )}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td align="center" style="padding:16px 0 24px 0;">
            ${button('Choose a new password', link)}
          </td></tr>
        </table>

        ${paragraph(
          `<span style="color:${MUTED};">This link expires in ${window} and can be used once. ` +
            `If you did not request a reset, you can safely ignore this email — your password will not change.</span>`
        )}

        <!-- The full URL is deliberately not printed here: a long token string
             reads as spam and clutters the layout. The button carries it. -->
        <div style="border-top:1px solid ${LINE}; margin:26px 0 0 0; padding-top:18px;">
          <p style="margin:0; font-family:${BODY}; font-size:12px; line-height:20px; color:${MUTED};">
            Button not working?
            <a href="${escapeHtml(link)}" style="color:${ACCENT}; text-decoration:underline;">Open the reset page</a>.
          </p>
        </div>`;

  const text =
    `${BRAND.toUpperCase()} — ${TAGLINE}\n` +
    `${'-'.repeat(44)}\n\n` +
    `Hello ${name},\n\n` +
    `We received a request to reset the password for your ${BRAND} account.\n` +
    `Choose a new one here:\n\n${link}\n\n` +
    `This link expires in ${window} and can be used once.\n` +
    `If you did not request a reset, you can safely ignore this email —\n` +
    `your password will not change.\n\n` +
    `${'-'.repeat(44)}\n` +
    `${BRAND} · ${TAGLINE}\n` +
    `This message was sent automatically — replies are not monitored.\n`;

  return {
    subject: `Reset your ${BRAND} password`,
    text,
    html: layout({
      preheader: `Your password reset link — valid for ${window}.`,
      heading: 'Reset your password',
      body,
    }),
  };
}
