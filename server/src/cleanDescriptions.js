// One-off content cleanup for product descriptions imported from marketplace
// listings:
//
//   1. drops the whole "Perfect For" section (heading + its bullets)
//   2. reduces the "Shipping" section to the single delivery-time line
//
// Descriptions are blank-line separated blocks — a heading is its own block and
// its bullets are the block after it — so the cleanup works on blocks rather
// than trying to regex across the whole string.
//
// Run a preview first:   node src/cleanDescriptions.js
// Then apply:            node src/cleanDescriptions.js --apply
// The originals are written to descriptions-backup.json before anything
// changes, and can be put back with:  node src/cleanDescriptions.js --restore

import 'dotenv/config';
import dns from 'dns';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Product from './models/Product.js';

// Some ISP resolvers refuse SRV lookups, which is what Atlas connection strings
// need. Ask a public resolver instead of the system one.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_FILE = path.join(__dirname, '..', 'descriptions-backup.json');

const DELIVERY_LINE = '* Delivery Time: 5–7 Business Days.';
const isBulletBlock = (block) => /^\s*[*\-•]/.test(block);
const headingIs = (block, heading) => block.trim().toLowerCase() === heading;

function cleanDescription(description) {
  // Keep the original line endings — these listings use \r\n.
  const blocks = description.split(/\r?\n\r?\n/);
  const out = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // "Perfect For" — drop the heading and the bullet list under it.
    if (headingIs(block, 'perfect for')) {
      if (isBulletBlock(blocks[i + 1] || '')) i++;
      continue;
    }

    // "Shipping" — keep the heading, replace its bullets with one line.
    // "Packaging & Shipping" is prose in other listings and is left alone.
    if (headingIs(block, 'shipping') && isBulletBlock(blocks[i + 1] || '')) {
      out.push(block, DELIVERY_LINE);
      i++;
      continue;
    }

    out.push(block);
  }

  return out.join('\r\n\r\n');
}

const apply = process.argv.includes('--apply');
const restore = process.argv.includes('--restore');

await mongoose.connect(process.env.MONGO_URI.trim());

if (restore) {
  const backup = JSON.parse(await fs.readFile(BACKUP_FILE, 'utf8'));
  for (const { _id, description } of backup) {
    await Product.updateOne({ _id }, { $set: { description } });
  }
  console.log(`Restored ${backup.length} descriptions from ${BACKUP_FILE}`);
  await mongoose.disconnect();
  process.exit(0);
}

const products = await Product.find({}, 'name slug description').lean();
const changed = products
  .map((p) => ({ ...p, cleaned: cleanDescription(p.description || '') }))
  .filter((p) => p.cleaned !== p.description);

if (!changed.length) {
  console.log('Nothing to clean — no "Perfect For" or "Shipping" sections found.');
} else {
  for (const p of changed) {
    console.log(`\n=== ${p.name}`);
    const before = new Set(p.description.split(/\r?\n/));
    const after = new Set(p.cleaned.split(/\r?\n/));
    for (const line of before) if (!after.has(line) && line.trim()) console.log(`  - ${line}`);
    for (const line of after) if (!before.has(line) && line.trim()) console.log(`  + ${line}`);
  }
  console.log(`\n${changed.length} product(s) affected.`);

  if (apply) {
    await fs.writeFile(
      BACKUP_FILE,
      JSON.stringify(changed.map(({ _id, name, description }) => ({ _id, name, description })), null, 2)
    );
    console.log(`Originals backed up to ${BACKUP_FILE}`);
    for (const p of changed) {
      await Product.updateOne({ _id: p._id }, { $set: { description: p.cleaned } });
    }
    console.log('Applied.');
  } else {
    console.log('Preview only — re-run with --apply to save.');
  }
}

await mongoose.disconnect();
