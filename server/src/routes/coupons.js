import { Router } from 'express';
import CouponCode from '../models/CouponCode.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

// GET /api/coupons — pool overview for the admin (available count + recent codes)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const [available, used] = await Promise.all([
      CouponCode.countDocuments({ used: false }),
      CouponCode.countDocuments({ used: true }),
    ]);
    const codes = await CouponCode.find().sort({ createdAt: -1 }).limit(100).select('code used createdAt');
    res.json({ available, used, total: available + used, codes });
  } catch (err) {
    res.status(500).json({ message: 'Could not load coupon pool', error: err.message });
  }
});

// POST /api/coupons — bulk-add codes generated in the Etsy dashboard
// body: { codes: "SILVER15-A\nSILVER15-B, SILVER15-C" }
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const raw = String(req.body.codes || '');
    const wanted = [...new Set(
      raw.split(/[\s,]+/).map((c) => c.trim().toUpperCase()).filter(Boolean)
    )];
    if (!wanted.length) return res.status(400).json({ message: 'Paste at least one code' });

    // Skip codes already in the pool so re-pasting is safe
    const existing = await CouponCode.find({ code: { $in: wanted } }).select('code');
    const existingSet = new Set(existing.map((c) => c.code));
    const fresh = wanted.filter((c) => !existingSet.has(c));

    if (fresh.length) await CouponCode.insertMany(fresh.map((code) => ({ code })));
    res.status(201).json({ added: fresh.length, skipped: wanted.length - fresh.length });
  } catch (err) {
    res.status(500).json({ message: 'Could not add codes', error: err.message });
  }
});

// PATCH /api/coupons/:id — fix a mistyped code. Only while it is still unused:
// once a code is assigned, the customer already has that exact string.
router.patch('/:id', protect, adminOnly, async (req, res) => {
  try {
    const code = String(req.body.code || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ message: 'A code is required' });
    if (/[\s,]/.test(code)) return res.status(400).json({ message: 'A code cannot contain spaces or commas' });

    const coupon = await CouponCode.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Code not found' });
    if (coupon.used) {
      return res.status(409).json({ message: 'This code has already been sent to a customer and cannot be edited' });
    }

    coupon.code = code;
    await coupon.save();
    res.json({ _id: coupon._id, code: coupon.code, used: coupon.used, createdAt: coupon.createdAt });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'That code is already in the pool' });
    res.status(500).json({ message: 'Could not update code', error: err.message });
  }
});

// DELETE /api/coupons/:id — drop an unused code from the pool
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await CouponCode.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Code not found' });
    if (coupon.used) {
      return res.status(409).json({ message: 'This code has already been sent to a customer and cannot be deleted' });
    }

    await coupon.deleteOne();
    res.json({ _id: coupon._id });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete code', error: err.message });
  }
});

export default router;
