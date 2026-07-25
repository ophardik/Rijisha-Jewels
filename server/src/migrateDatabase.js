// Copy every collection from one MongoDB cluster to another.
//
// For moving the shop to a different Atlas account. Documents keep their _id,
// so references between collections (orders → products, reviews → users) stay
// intact. Indexes are recreated too — the unique index on users.email and
// products.slug are what stop duplicate accounts and duplicate URLs, and a
// copy without them would look fine until the first collision.
//
//   node src/migrateDatabase.js "<source-uri>" "<target-uri>"          # preview
//   node src/migrateDatabase.js "<source-uri>" "<target-uri>" --go     # copy
//
// The source is only ever read from. Safe to run repeatedly: a target
// collection that already holds documents is skipped unless --force is passed.

import { MongoClient } from 'mongodb';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const DRY_RUN = !process.argv.includes('--go');
const FORCE = process.argv.includes('--force');

const [sourceUri, targetUri] = args;

if (!sourceUri || !targetUri) {
  console.error('Usage: node src/migrateDatabase.js "<source-uri>" "<target-uri>" [--go] [--force]');
  process.exit(1);
}

// Mongo's own bookkeeping, not application data.
const SKIP = new Set(['system.indexes', 'system.views']);

// Parsed by hand rather than with `new URL`: a replica-set URI lists its hosts
// comma-separated (host1:27017,host2:27017), which is valid for MongoDB but not
// a valid URL, so the URL class rejects it outright.
const dbNameFrom = (uri) => {
  const match = /^mongodb(?:\+srv)?:\/\/[^/]*\/([^?]*)/.exec(uri);
  const name = match?.[1];
  if (!name) {
    throw new Error(
      `No database name in the connection string: ${uri.replace(/\/\/([^:]+):[^@]+@/, '//$1:***@')}\n` +
        'Add it after the host, e.g. ...mongodb.net/rijisha?retryWrites=true'
    );
  }
  return decodeURIComponent(name);
};

async function main() {
  // Resolved before connecting, so a connection string missing its database
  // name fails with that message rather than a confusing DNS error.
  const sourceName = dbNameFrom(sourceUri);
  const targetName = dbNameFrom(targetUri);

  const source = new MongoClient(sourceUri);
  const target = new MongoClient(targetUri);

  await source.connect();
  await target.connect();

  const sourceDb = source.db(sourceName);
  const targetDb = target.db(targetName);

  console.log(`from : ${sourceDb.databaseName}`);
  console.log(`to   : ${targetDb.databaseName}${DRY_RUN ? '   (DRY RUN — nothing will be written)' : ''}\n`);

  const collections = (await sourceDb.listCollections().toArray())
    .filter((c) => c.type !== 'view' && !SKIP.has(c.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  let copied = 0;
  let skipped = 0;

  for (const { name } of collections) {
    const docs = await sourceDb.collection(name).find({}).toArray();
    const existing = await targetDb.collection(name).countDocuments();

    if (existing > 0 && !FORCE) {
      console.log(`  ${name.padEnd(18)} SKIPPED — target already has ${existing} doc(s); pass --force to replace`);
      skipped++;
      continue;
    }

    // Indexes minus _id_, which every collection gets automatically.
    const indexes = (await sourceDb.collection(name).indexes()).filter((i) => i.name !== '_id_');

    if (DRY_RUN) {
      console.log(`  ${name.padEnd(18)} would copy ${docs.length} doc(s), ${indexes.length} index(es)`);
      copied++;
      continue;
    }

    if (existing > 0) await targetDb.collection(name).deleteMany({});
    if (docs.length) await targetDb.collection(name).insertMany(docs, { ordered: false });

    for (const { key, name: indexName, v, ...options } of indexes) {
      try {
        await targetDb.collection(name).createIndex(key, { name: indexName, ...options });
      } catch (err) {
        console.warn(`    ! index ${indexName} on ${name}: ${err.message}`);
      }
    }

    console.log(`  ${name.padEnd(18)} copied ${docs.length} doc(s), ${indexes.length} index(es)`);
    copied++;
  }

  console.log(
    `\n${DRY_RUN ? 'Would copy' : 'Copied'} ${copied} collection(s)` + (skipped ? `, skipped ${skipped}` : '')
  );
  if (DRY_RUN) console.log('Re-run with  --go  to apply.');

  await source.close();
  await target.close();
}

main().catch(async (err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
