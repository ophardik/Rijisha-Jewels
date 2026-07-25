// One-time move of already-uploaded files from server/uploads to Cloudinary.
//
//   npm run migrate:uploads          # show what would change, touch nothing
//   npm run migrate:uploads -- --go  # actually upload and rewrite the database
//
// Safe to run more than once: anything already on an https:// URL is skipped,
// so a run that dies halfway can simply be run again.

import 'dotenv/config';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs/promises';
import { v2 as cloudinary } from 'cloudinary';
import { uploadDir } from './config.js';
import { cloudinaryConfigured } from './storage.js';
import Product from './models/Product.js';
import HomeCollection from './models/HomeCollection.js';
import Review from './models/Review.js';

const DRY_RUN = !process.argv.includes('--go');
const ROOT_FOLDER = process.env.CLOUDINARY_FOLDER?.trim() || 'rijisha';

const isLocal = (url) => typeof url === 'string' && url.startsWith('/uploads/');

let uploaded = 0;
let missing = 0;

/**
 * Upload one /uploads/<name> file and return its Cloudinary URL, or null if the
 * file is already gone from disk (a previous deploy ate it).
 */
async function migrateUrl(url, folder) {
  const filePath = path.join(uploadDir, path.basename(url));
  try {
    await fs.access(filePath);
  } catch {
    console.warn(`  ! missing on disk, leaving as-is: ${url}`);
    missing++;
    return null;
  }

  if (DRY_RUN) {
    console.log(`  would upload ${url} → ${ROOT_FOLDER}/${folder}/`);
    uploaded++;
    // A stand-in for the URL a real run would get back, so the de-duplication
    // below behaves the same way and the preview count matches reality. Nothing
    // is saved in a dry run, so this never reaches the database.
    return `https://res.cloudinary.com/DRY-RUN/${ROOT_FOLDER}/${folder}/${path.basename(url)}`;
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder: `${ROOT_FOLDER}/${folder}`,
    resource_type: 'auto',
    unique_filename: true,
  });
  console.log(`  ${url} → ${result.secure_url}`);
  uploaded++;
  return result.secure_url;
}

async function migrateProducts() {
  console.log('\nProducts');
  const products = await Product.find({});
  for (const product of products) {
    let changed = false;
    // Old /uploads/ URL → new Cloudinary URL. Cloudinary assigns its own
    // public_id, so the new filename tells you nothing about the old one —
    // the mapping has to be remembered as we go.
    const moved = new Map();

    for (const item of product.media || []) {
      if (!isLocal(item.url)) continue;
      const url = await migrateUrl(item.url, 'products');
      if (url) {
        moved.set(item.url, url);
        item.url = url;
        changed = true;
      }
    }

    // `image` is the card thumbnail and normally mirrors one of the media
    // entries. Re-point it at whatever that entry became, rather than uploading
    // a second copy of the identical file.
    if (isLocal(product.image)) {
      const already = moved.get(product.image);
      const url = already || (await migrateUrl(product.image, 'products'));
      if (url) {
        product.image = url;
        changed = true;
      }
    }

    if (changed && !DRY_RUN) await product.save();
  }
}

async function migrateCollections() {
  console.log('\nHome collections');
  for (const doc of await HomeCollection.find({})) {
    if (!isLocal(doc.image)) continue;
    const url = await migrateUrl(doc.image, 'collections');
    if (url && !DRY_RUN) {
      doc.image = url;
      await doc.save();
    }
  }
}

async function migrateReviews() {
  console.log('\nReview photos');
  for (const review of await Review.find({ photos: { $ne: [] } })) {
    let changed = false;
    for (let i = 0; i < review.photos.length; i++) {
      if (!isLocal(review.photos[i])) continue;
      const url = await migrateUrl(review.photos[i], 'reviews');
      if (url) {
        review.photos[i] = url;
        changed = true;
      }
    }
    if (changed && !DRY_RUN) await review.save();
  }
}

async function main() {
  if (!cloudinaryConfigured) {
    console.error('CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET are not set in server/.env — nothing to migrate to.');
    process.exit(1);
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
    secure: true,
  });

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to "${mongoose.connection.name}"${DRY_RUN ? '  (DRY RUN — no changes)' : ''}`);

  await migrateProducts();
  await migrateCollections();
  await migrateReviews();

  console.log(
    `\n${DRY_RUN ? 'Would upload' : 'Uploaded'} ${uploaded} file(s); ${missing} referenced file(s) no longer on disk.`
  );
  if (DRY_RUN) console.log('Re-run with  --go  to apply.');

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Migration failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
