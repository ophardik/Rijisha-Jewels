import { Router } from 'express';
import Reward from '../models/Reward.js';
import Review from '../models/Review.js';
import CouponCode from '../models/CouponCode.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { REWARD_STATUS } from '../enums.js';

const router = Router();

// Shape a reward for the customer's own view (their code is only theirs to see)
const mineView = (r) => ({
  _id: r._id,
  status: r.status,
  code: r.status === REWARD_STATUS.APPROVED ? r.code : '',
  etsyOrderNo: r.etsyOrderNo,
  review: r.review, // populated: product, rating, photos
  createdAt: r.createdAt,
});

// POST /api/rewards — claim the 15% offer for one of my photo reviews
// body: { reviewId, etsyOrderNo }
router.post('/', protect, async (req, res) => {
  try {
    const { reviewId, etsyOrderNo } = req.body;
    const orderNo = String(etsyOrderNo || '').trim();
    if (!reviewId || !orderNo) {
      return res.status(400).json({ message: 'A review and your Etsy order number are required' });
    }

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only claim a reward for your own review' });
    }
    // The reward is for sharing a real photo of the piece — the star rating is
    // never a condition, so this stays clear of incentivised-review rules.
    if (!review.photos?.length) {
      return res.status(400).json({ message: 'Add a photo to your review to claim the reward' });
    }

    const existing = await Reward.findOne({ review: review._id });
    if (existing) {
      // A rejected claim can be corrected and resubmitted for another look
      if (existing.status === REWARD_STATUS.REJECTED) {
        try {
          existing.etsyOrderNo = orderNo;
          existing.status = REWARD_STATUS.PENDING;
          existing.code = '';
          await existing.save();
          return res.json(mineView(existing.toObject()));
        } catch (err) {
          if (err.code === 11000) {
            return res.status(409).json({ message: 'That Etsy order number has already been used' });
          }
          throw err;
        }
      }
      return res.status(409).json({ message: 'You have already claimed a reward for this review' });
    }

    const reward = await Reward.create({
      user: req.user._id,
      review: review._id,
      etsyOrderNo: orderNo,
    });
    res.status(201).json(mineView(reward.toObject()));
  } catch (err) {
    if (err.code === 11000) {
      // Either the order number was already used, or a race on the review index
      const field = err.keyPattern?.etsyOrderNo ? 'That Etsy order number has already been used' : 'A reward already exists for this review';
      return res.status(409).json({ message: field });
    }
    res.status(500).json({ message: 'Could not claim reward', error: err.message });
  }
});

// GET /api/rewards/mine — my rewards, newest first
router.get('/mine', protect, async (req, res) => {
  try {
    const rewards = await Reward.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'review', select: 'product rating photos comment', populate: { path: 'product', select: 'name slug' } });
    res.json(rewards.map((r) => mineView(r.toObject())));
  } catch (err) {
    res.status(500).json({ message: 'Could not load your rewards', error: err.message });
  }
});

// ---------- admin ----------

// Work the admin still has to do comes first. Sorting by the status string
// instead would put 'approved' on top — the finished claims.
const STATUS_RANK = {
  [REWARD_STATUS.PENDING]: 0,
  [REWARD_STATUS.REJECTED]: 1,
  [REWARD_STATUS.APPROVED]: 2,
};

// GET /api/rewards — all claims for the admin queue
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const rewards = await Reward.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate({ path: 'review', select: 'product rating comment photos', populate: { path: 'product', select: 'name slug' } });
    // Stable sort, so newest-first still holds within each status group
    rewards.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ message: 'Could not load rewards', error: err.message });
  }
});

// Put a code back in the pool when the approval it was pulled for didn't happen
const releaseCoupon = (coupon) =>
  CouponCode.updateOne({ _id: coupon._id }, { used: false, assignedTo: null, reward: null });

// POST /api/rewards/:id/approve — verify the order and assign the next free code
router.post('/:id/approve', protect, adminOnly, async (req, res) => {
  let coupon = null;
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) return res.status(404).json({ message: 'Reward not found' });
    if (reward.status === REWARD_STATUS.APPROVED) {
      return res.status(400).json({ message: 'This reward is already approved' });
    }

    // Atomically claim the next unused code so two approvals can't grab the same one
    coupon = await CouponCode.findOneAndUpdate(
      { used: false },
      { used: true, assignedTo: reward.user, reward: reward._id },
      { new: true, sort: { createdAt: 1 } }
    );
    if (!coupon) {
      return res.status(409).json({ message: 'No coupon codes left in the pool — add more codes first' });
    }

    // Only the request that flips the status gets to hand out its code. Two
    // admins clicking approve together would otherwise spend two codes.
    const approved = await Reward.findOneAndUpdate(
      { _id: reward._id, status: { $ne: REWARD_STATUS.APPROVED } },
      { status: REWARD_STATUS.APPROVED, code: coupon.code },
      { new: true }
    );
    if (!approved) {
      await releaseCoupon(coupon);
      return res.status(400).json({ message: 'This reward is already approved' });
    }

    res.json(approved);
  } catch (err) {
    // Never leave a code marked used for an approval that failed
    if (coupon) await releaseCoupon(coupon).catch(() => {});
    res.status(500).json({ message: 'Could not approve reward', error: err.message });
  }
});

// POST /api/rewards/:id/reject
router.post('/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) return res.status(404).json({ message: 'Reward not found' });
    if (reward.status === REWARD_STATUS.APPROVED) {
      return res.status(400).json({ message: 'Cannot reject a reward that already has a code' });
    }
    reward.status = REWARD_STATUS.REJECTED;
    await reward.save();
    res.json(reward);
  } catch (err) {
    res.status(500).json({ message: 'Could not reject reward', error: err.message });
  }
});

export default router;
