import { Router } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- customer photo upload ----------
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.]+/g, '-').toLowerCase();
    cb(null, `review-${Date.now()}-${safe}`);
  },
});

const IMAGE_RE = /^image\/(jpe?g|png|webp|gif|avif)$/;

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 4 },
  fileFilter: (req, file, cb) => {
    if (IMAGE_RE.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only photos (jpg, png, webp, gif, avif) are allowed'));
  },
});

const uploadPhotos = (req, res, next) =>
  upload.array('photos', 4)(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });

function removeUploadFile(url) {
  if (url?.startsWith('/uploads/')) {
    fs.unlink(path.join(uploadDir, path.basename(url)), () => {});
  }
}

// Keep the product's headline rating in sync with real reviews
async function syncProductRating(productId) {
  const [stats] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
    numReviews: stats ? stats.count : 0,
  });
}

// GET /api/reviews/:productId — newest first
router.get('/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Could not load reviews', error: err.message });
  }
});

// POST /api/reviews/:productId  (multipart/form-data: rating, comment, up to 4 "photos")
router.post('/:productId', protect, uploadPhotos, async (req, res) => {
  const photos = (req.files || []).map((f) => `/uploads/${f.filename}`);
  try {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Please pick a star rating' });
    }
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const review = await Review.create({
      product: product._id,
      user: req.user._id,
      name: req.user.name,
      rating,
      comment: String(req.body.comment || '').trim(),
      photos,
    });
    await syncProductRating(product._id);
    res.status(201).json(review);
  } catch (err) {
    for (const url of photos) removeUploadFile(url);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this piece' });
    }
    res.status(500).json({ message: 'Could not post review', error: err.message });
  }
});

// DELETE /api/reviews/:id — the reviewer or an admin
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You can only delete your own review' });
    }
    await review.deleteOne();
    for (const url of review.photos) removeUploadFile(url);
    await syncProductRating(review.product);
    res.json({ message: 'Review deleted', id: review._id });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete review', error: err.message });
  }
});

export default router;
