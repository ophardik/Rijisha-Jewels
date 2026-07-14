import { Router } from 'express';
import { protect } from '../middleware/auth.js';

const router = Router();

// GET /api/wishlist — full product docs
router.get('/', protect, async (req, res) => {
  const populated = await req.user.populate('wishlist');
  res.json(populated.wishlist);
});

// POST /api/wishlist/:productId — toggle
router.post('/:productId', protect, async (req, res) => {
  const { productId } = req.params;
  const has = req.user.wishlist.some((id) => id.toString() === productId);
  if (has) {
    req.user.wishlist = req.user.wishlist.filter((id) => id.toString() !== productId);
  } else {
    req.user.wishlist.push(productId);
  }
  await req.user.save();
  res.json({ wishlist: req.user.wishlist, added: !has });
});

export default router;
