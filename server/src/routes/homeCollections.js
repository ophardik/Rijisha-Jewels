import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import HomeCollection from '../models/HomeCollection.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// The four collection cards take photos; the "hero" slot takes the home-page video.
const CATEGORIES = ['earrings', 'necklaces', 'bracelets', 'antique'];
const SLOTS = [...CATEGORIES, 'hero'];

// ---------- image upload ----------
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.]+/g, '-').toLowerCase();
    cb(null, `collection-${Date.now()}-${safe}`);
  },
});

const IMAGE_RE = /^image\/(jpe?g|png|webp|gif|avif)$/;
const VIDEO_RE = /^video\/(mp4|webm|ogg|quicktime)$/;

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (req.params.category === 'hero') {
      if (VIDEO_RE.test(file.mimetype)) cb(null, true);
      else cb(new Error('The hero slot takes a video (mp4, webm, ogg, mov)'));
    } else if (IMAGE_RE.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only photos (jpg, png, webp, gif, avif) are allowed'));
    }
  },
});

const uploadImage = (req, res, next) =>
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });

function removeUploadFile(url) {
  if (url?.startsWith('/uploads/')) {
    fs.unlink(path.join(uploadDir, path.basename(url)), () => {});
  }
}

// ---------- public ----------

// GET /api/home-collections → { earrings: '/uploads/..', hero: '/uploads/..', ... }
// Slots without a custom upload are simply absent.
router.get('/', async (req, res) => {
  try {
    const docs = await HomeCollection.find();
    const map = {};
    for (const doc of docs) map[doc.category] = doc.image;
    res.json(map);
  } catch (err) {
    res.status(500).json({ message: 'Could not load collection images', error: err.message });
  }
});

// ---------- admin ----------

// PUT /api/home-collections/:category  (multipart/form-data, "image" file)
// Sets or replaces the photo for a collection card, or the video for "hero".
router.put('/:category', protect, adminOnly, uploadImage, async (req, res) => {
  try {
    const { category } = req.params;
    if (!SLOTS.includes(category)) {
      return res.status(400).json({ message: `Slot must be one of: ${SLOTS.join(', ')}` });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Please choose a file to upload' });
    }

    const image = `/uploads/${req.file.filename}`;
    const existing = await HomeCollection.findOne({ category });
    if (existing) {
      removeUploadFile(existing.image);
      existing.image = image;
      await existing.save();
    } else {
      await HomeCollection.create({ category, image });
    }
    res.json({ category, image });
  } catch (err) {
    res.status(500).json({ message: 'Could not update collection image', error: err.message });
  }
});

// DELETE /api/home-collections/:category — revert a slot to its built-in default
router.delete('/:category', protect, adminOnly, async (req, res) => {
  try {
    const { category } = req.params;
    if (!SLOTS.includes(category)) {
      return res.status(400).json({ message: `Slot must be one of: ${SLOTS.join(', ')}` });
    }

    const doc = await HomeCollection.findOneAndDelete({ category });
    if (doc) removeUploadFile(doc.image);
    res.json({ category, image: null });
  } catch (err) {
    res.status(500).json({ message: 'Could not reset collection image', error: err.message });
  }
});

export default router;
