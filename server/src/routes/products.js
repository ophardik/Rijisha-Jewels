import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import Product from '../models/Product.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { uploadDir } from '../config.js';
import { persistUpload, removeUpload } from '../storage.js';
import { CATEGORIES, CATEGORY_ALL, SORT, MEDIA_TYPE } from '../enums.js';

const router = Router();

// ---------- media upload ----------
// multer writes here first; storage.js then moves the file to Cloudinary and
// deletes this copy, so nothing durable depends on the server's own disk.
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.]+/g, '-').toLowerCase();
    cb(null, `${Date.now()}-${safe}`);
  },
});

const IMAGE_RE = /^image\/(jpe?g|png|webp|gif|avif)$/;
const VIDEO_RE = /^video\/(mp4|webm|ogg|quicktime)$/;

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (IMAGE_RE.test(file.mimetype) || VIDEO_RE.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only photos (jpg, png, webp, gif, avif) and videos (mp4, webm, ogg, mov) are allowed'));
  },
});

// Wrap multer so its errors become clean JSON responses.
// Accepts multiple "media" files plus the legacy single "image" field.
const uploadMedia = (req, res, next) =>
  upload.fields([{ name: 'media', maxCount: 10 }, { name: 'image', maxCount: 1 }])(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });

async function uploadedMedia(req) {
  const files = [...(req.files?.media || []), ...(req.files?.image || [])];
  return Promise.all(
    files.map(async (file) => ({
      url: await persistUpload(file, 'products'),
      type: VIDEO_RE.test(file.mimetype) ? MEDIA_TYPE.VIDEO : MEDIA_TYPE.IMAGE,
    }))
  );
}

// Keep product.image (card thumbnail) in sync: first photo, else first video
function syncThumbnail(product) {
  const first = product.media.find((m) => m.type === MEDIA_TYPE.IMAGE) || product.media[0];
  product.image = first ? first.url : '';
}

// ---------- helpers ----------
async function uniqueSlug(name, currentId = null) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product';
  let slug = base;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await Product.findOne({ slug, ...(currentId ? { _id: { $ne: currentId } } : {}) });
    if (!clash) return slug;
    slug = `${base}-${n++}`;
  }
}

function readFields(body) {
  const fields = {};
  const strings = ['name', 'category', 'subCategory', 'description', 'tag', 'art', 'bg', 'image'];
  const numbers = ['price', 'mrp', 'stock'];
  for (const key of strings) if (body[key] !== undefined) fields[key] = String(body[key]).trim();
  for (const key of numbers) {
    if (body[key] !== undefined && body[key] !== '') {
      const value = Number(body[key]);
      if (!Number.isNaN(value)) fields[key] = value;
    }
  }
  if (body.mrp === '') fields.mrp = null;
  return fields;
}

// ---------- public ----------

// GET /api/products?category=earrings&sort=price_asc&search=jhumka
router.get('/', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const filter = {};
    if (category && category !== CATEGORY_ALL) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const sortMap = {
      [SORT.PRICE_ASC]: { price: 1 },
      [SORT.PRICE_DESC]: { price: -1 },
      [SORT.RATING]: { rating: -1, numReviews: -1 },
      [SORT.NEWEST]: { createdAt: -1 },
    };

    const products = await Product.find(filter).sort(sortMap[sort] || { createdAt: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Could not load products', error: err.message });
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Could not load product', error: err.message });
  }
});

// ---------- admin ----------

// POST /api/products  (multipart/form-data, optional "media" files — photos & videos)
router.post('/', protect, adminOnly, uploadMedia, async (req, res) => {
  try {
    const fields = readFields(req.body);
    if (!fields.name || !fields.category || fields.price === undefined) {
      return res.status(400).json({ message: 'Name, category and price are required' });
    }
    if (!CATEGORIES.includes(fields.category)) {
      return res.status(400).json({ message: `Category must be one of: ${CATEGORIES.join(', ')}` });
    }
    fields.media = await uploadedMedia(req);
    fields.slug = await uniqueSlug(fields.name);

    const product = new Product(fields);
    if (product.media.length) syncThumbnail(product);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Could not create product', error: err.message });
  }
});

// PUT /api/products/:id
// "existingMedia" (JSON array) = media the admin kept; anything missing is deleted.
// New "media" files are appended after the kept ones.
router.put('/:id', protect, adminOnly, uploadMedia, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const fields = readFields(req.body);
    if (fields.category && !CATEGORIES.includes(fields.category)) {
      return res.status(400).json({ message: `Category must be one of: ${CATEGORIES.join(', ')}` });
    }
    if (fields.name && fields.name !== product.name) {
      fields.slug = await uniqueSlug(fields.name, product._id);
    }

    if (req.body.existingMedia !== undefined) {
      let kept = [];
      try {
        kept = JSON.parse(req.body.existingMedia);
      } catch {
        return res.status(400).json({ message: 'Invalid existingMedia' });
      }
      // Legacy products may only have `image` — treat it as a one-item gallery
      const currentMedia = product.media.length
        ? product.media
        : product.image ? [{ url: product.image, type: MEDIA_TYPE.IMAGE }] : [];
      const keptUrls = new Set(kept.map((m) => m.url));
      for (const m of currentMedia) {
        if (!keptUrls.has(m.url)) await removeUpload(m.url);
      }
      fields.media = currentMedia
        .filter((m) => keptUrls.has(m.url))
        .map(({ url, type }) => ({ url, type }))
        .concat(await uploadedMedia(req));
    } else if (req.files?.media?.length || req.files?.image?.length) {
      fields.media = product.media.concat(await uploadedMedia(req));
    }

    Object.assign(product, fields);
    if (fields.media) syncThumbnail(product);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Could not update product', error: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    // Remove any uploaded files that were ours. product.image mirrors media[0],
    // so deleting it separately would double-delete — media covers it.
    for (const m of product.media || []) await removeUpload(m.url);
    if (!product.media?.length) await removeUpload(product.image);
    res.json({ message: 'Product deleted', id: product._id });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete product', error: err.message });
  }
});

export default router;
