import { Router } from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import { protect, signToken } from '../middleware/auth.js';
import { sendMail } from '../mailer.js';
import { resetPasswordEmail } from '../emails.js';
import { storefrontUrl } from '../config.js';

const router = Router();

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, isAdmin: u.isAdmin, wishlist: u.wishlist });

// The schema's `lowercase`/`trim` normalise on SAVE, not on QUERY — so a stored
// address is always clean, but a lookup built from raw input is not. Without
// this, an address pasted with a trailing space (or typed on a phone keyboard
// that appends one) fails to match a perfectly good account and the user is
// told their credentials are invalid.
const normaliseEmail = (value) => value?.trim().toLowerCase();

// How long a reset link stays usable. Long enough to walk to another device,
// short enough that a link left sitting in an inbox stops being a key.
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
// Minimum gap between two reset emails to the same account, so the endpoint
// cannot be used to flood someone's inbox.
const RESET_COOLDOWN_MS = 60 * 1000; // 1 minute

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const exists = await User.findOne({ email: normaliseEmail(email) });
    if (exists) return res.status(409).json({ message: 'An account with this email already exists' });

    const user = await User.create({ name, email, password });
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// POST /api/auth/login — customers only; admins must use /api/auth/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: normaliseEmail(email) }).select('+password');
    if (!user || !(await user.matchPassword(password || ''))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    // Admins must use /api/auth/admin/login — respond with the same generic
    // message as a wrong password so the login page never reveals admin accounts.
    if (user.isAdmin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// POST /api/auth/admin/login — admin accounts only
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: normaliseEmail(email) }).select('+password');
    if (!user || !(await user.matchPassword(password || ''))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'This portal is for administrators only' });
    }
    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// POST /api/auth/forgot-password
//
// Always answers 200 with the same message, whether or not the email belongs to
// an account. Anything else turns this endpoint into a way to test which of a
// list of email addresses shops here.
router.post('/forgot-password', async (req, res) => {
  const done = () => res.json({ message: 'If that email has an account, a reset link is on its way.' });
  try {
    const email = normaliseEmail(req.body?.email);
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email }).select('+resetRequestedAt');
    // Admin passwords come from ADMIN_EMAIL/ADMIN_PASSWORD in the host
    // environment, so admins recover there rather than over email — and the
    // storefront never confirms that an admin account exists.
    if (!user || user.isAdmin) return done();

    // Already sent one moments ago — pretend we sent another.
    if (user.resetRequestedAt && Date.now() - user.resetRequestedAt.getTime() < RESET_COOLDOWN_MS) {
      return done();
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = hashToken(token);
    user.resetTokenExpires = new Date(Date.now() + RESET_TTL_MS);
    user.resetRequestedAt = new Date();
    await user.save({ validateBeforeSave: false });

    const link = `${storefrontUrl()}/reset-password?token=${token}`;
    const hours = Math.round(RESET_TTL_MS / (60 * 60 * 1000));
    await sendMail({ to: user.email, ...resetPasswordEmail(user.name.split(' ')[0], link, hours) });

    done();
  } catch (err) {
    res.status(500).json({ message: 'Could not start the password reset', error: err.message });
  }
});

// GET /api/auth/reset-password/:token — is this link still good?
// Lets the page say "this link has expired" before the customer types a new
// password, instead of after.
router.get('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetTokenHash: hashToken(req.params.token),
      resetTokenExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired' });
    res.json({ valid: true, email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Could not check the reset link', error: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findOne({
      resetTokenHash: hashToken(token),
      resetTokenExpires: { $gt: new Date() },
    }).select('+password +resetTokenHash +resetTokenExpires +resetRequestedAt');
    if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired' });

    user.password = password; // hashed by the pre-save hook
    // Burn the token so the same link cannot be replayed.
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    user.resetRequestedAt = undefined;
    await user.save();

    res.json({ message: 'Your password has been updated' });
  } catch (err) {
    res.status(500).json({ message: 'Could not reset the password', error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
