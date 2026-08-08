// Sets the admin account's email and password from ADMIN_EMAIL / ADMIN_PASSWORD.
//
// Why this exists: seedAdmin() in seed.js deliberately only ever CREATES. It
// will not touch an account that already exists, because silently rewriting a
// password on every boot would mean anyone who could edit the environment could
// take over the panel on the next restart. The cost of that safety is that
// editing ADMIN_PASSWORD in .env appears to do nothing — the database keeps the
// original hash and you are locked out with credentials that look correct.
//
// This script is the deliberate, operator-run counterpart: run it by hand, and
// it writes the new credentials through.
//
//   npm run admin:set --prefix server
//
// Admins cannot recover by email (forgot-password refuses admin accounts on
// purpose, so the storefront never reveals that an admin address exists), so
// this is the supported recovery path.

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import User from './models/User.js';

const PROMOTE = process.argv.includes('--promote');

// Mirrors the query-time normalisation in routes/auth.js: the schema cleans on
// save, not on lookup, so an address with a stray space would otherwise create a
// second account rather than update the one already there.
const normaliseEmail = (value) => value?.trim().toLowerCase();

async function main() {
  const email = normaliseEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first.');
  }
  // Matches the schema's minlength, so this fails with a readable message rather
  // than a mongoose validation dump.
  if (password.length < 6) {
    throw new Error('ADMIN_PASSWORD must be at least 6 characters.');
  }

  await connectDB();

  const existing = await User.findOne({ email }).select('+password');

  if (!existing) {
    await User.create({ name: 'Rijisha Admin', email, password, isAdmin: true });
    console.log(`Created admin account: ${email}`);
  } else if (!existing.isAdmin && !PROMOTE) {
    // Same reasoning as seedAdmin: never hand admin to an account we did not
    // create just because someone put its address in the environment. Here it is
    // a refusal with an escape hatch rather than a hard no, because an operator
    // running this by hand may genuinely mean it.
    throw new Error(
      `${email} exists but is NOT an admin account. Refusing to promote it silently.\n` +
        '  If this is genuinely your account, re-run with:  npm run admin:set --prefix server -- --promote'
    );
  } else {
    const promoted = !existing.isAdmin;
    existing.password = password; // re-hashed by the pre-save hook
    existing.isAdmin = true;
    await existing.save();
    console.log(`Updated admin account: ${email}${promoted ? '  (promoted to admin)' : ''}`);
  }

  // A second admin left over from an earlier email is a live way into the panel,
  // and nothing else in the app would ever mention it.
  const others = await User.find({ isAdmin: true, email: { $ne: email } })
    .select('email')
    .lean();
  if (others.length) {
    console.log(`\nNote: ${others.length} other admin account(s) still exist:`);
    for (const o of others) console.log(`  - ${o.email}`);
    console.log('Remove any you no longer want to keep — they can still sign in.');
  }

  console.log('\nSign in at /admin/login with the email and password above.');
}

main()
  .catch((err) => {
    console.error(`\n${err.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
    // connectDB may have spawned an embedded mongod that keeps the loop alive.
    process.exit(process.exitCode ?? 0);
  });
