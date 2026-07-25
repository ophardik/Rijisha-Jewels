// Where uploaded photos and videos actually live.
//
// The server's own filesystem is not a safe place for them: on Render the
// machine is rebuilt from git on every deploy, and free instances are also
// rebuilt when they wake from sleep. Anything an admin uploaded at runtime is
// gone, leaving the database pointing at files that no longer exist.
//
// So uploads are pushed to Cloudinary and the database stores the returned
// https:// URL. The server then holds no files at all and can be wiped freely.
//
// Without Cloudinary credentials this falls back to the old behaviour — the
// file stays in server/uploads and the URL is /uploads/<name>. That keeps local
// development zero-setup, and it is why every route here goes through
// persistUpload/removeUpload rather than touching either store directly.

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import path from 'path';
import { uploadDir, isProduction } from './config.js';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

export const cloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (cloudinaryConfigured) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}

// Everything is namespaced under one folder so the Cloudinary console stays
// readable and a future second site cannot collide with this one.
const ROOT_FOLDER = process.env.CLOUDINARY_FOLDER?.trim() || 'rijisha';

export function warnIfStorageUnconfigured() {
  if (!cloudinaryConfigured) {
    console.warn(
      `[storage] Cloudinary is not configured — uploads stay on this server's disk (${
        isProduction ? 'PRODUCTION' : 'development'
      }).` +
        (isProduction
          ? ' On a rebuilt instance those files are lost and product images break. Set CLOUDINARY_* to fix.'
          : '')
    );
  }
}

/**
 * Move a freshly uploaded multer file to permanent storage.
 *
 * multer has already written it to disk, so Cloudinary is handed the path
 * rather than a buffer — a 50 MB video would otherwise sit in memory, which a
 * 512 MB free instance cannot spare.
 *
 * @param {{path: string, filename: string, mimetype: string}} file multer file
 * @param {string} folder sub-folder, e.g. 'products'
 * @returns {Promise<string>} the URL to store in MongoDB
 */
export async function persistUpload(file, folder) {
  if (!cloudinaryConfigured) return `/uploads/${file.filename}`;

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `${ROOT_FOLDER}/${folder}`,
      // 'auto' so the same call handles both photos and videos.
      resource_type: 'auto',
      // Never let a re-uploaded "IMG_1234.jpg" overwrite an existing asset.
      unique_filename: true,
    });
    // The local copy was only ever a staging file.
    await fs.unlink(file.path).catch(() => {});
    return result.secure_url;
  } catch (err) {
    // Keep the file on disk and return the local URL. The image works until the
    // next rebuild, which beats losing the admin's upload outright.
    console.error(`[storage] Cloudinary upload failed for ${file.filename}:`, err.message);
    return `/uploads/${file.filename}`;
  }
}

/** Upload several multer files, preserving order. */
export function persistUploads(files, folder) {
  return Promise.all(files.map((file) => persistUpload(file, folder)));
}

/**
 * Recover the Cloudinary public_id from a delivery URL, e.g.
 *   https://res.cloudinary.com/demo/image/upload/v1699/rijisha/products/ab.jpg
 *   → { publicId: 'rijisha/products/ab', resourceType: 'image' }
 * Returns null for anything that is not one of our Cloudinary URLs.
 */
function parseCloudinaryUrl(url) {
  const match = /res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(.+)$/.exec(url || '');
  if (!match) return null;
  const [, resourceType, rest] = match;
  const publicId = rest
    .replace(/^(?:[^/]+\/)*?v\d+\//, '') // drop any transform segments and the version
    .replace(/\.[^./]+$/, ''); // drop the extension
  return { publicId, resourceType };
}

/**
 * Delete a previously stored file. Safe to call with an external URL or an
 * empty string — anything we did not store is left alone.
 */
export async function removeUpload(url) {
  const parsed = parseCloudinaryUrl(url);
  if (parsed) {
    try {
      await cloudinary.uploader.destroy(parsed.publicId, { resource_type: parsed.resourceType });
    } catch (err) {
      // A failed delete only wastes storage quota — never fail the request.
      console.error(`[storage] Could not delete ${parsed.publicId}:`, err.message);
    }
    return;
  }
  if (url?.startsWith('/uploads/')) {
    await fs.unlink(path.join(uploadDir, path.basename(url))).catch(() => {});
  }
}
