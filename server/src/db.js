import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { isProduction } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function connectDB() {
  const uri = process.env.MONGO_URI?.trim();

  if (uri) {
    // mongodb+srv:// needs DNS SRV lookups, which many home routers mangle
    // (querySrv ECONNREFUSED) — resolve via public DNS instead. Hosting
    // providers have working resolvers, and overriding theirs can break
    // private networking, so this stays a development-only workaround.
    if (!isProduction && uri.startsWith('mongodb+srv://')) {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    }
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    return;
  }

  // Falling back to a throwaway database in production would look like a
  // successful deploy while every order and signup vanished on the next
  // restart. Fail loudly instead.
  if (isProduction) {
    throw new Error(
      'MONGO_URI is not set. Refusing to start in production with an embedded database — ' +
        'set MONGO_URI to your MongoDB Atlas connection string.'
    );
  }

  // No MONGO_URI configured — run an embedded MongoDB that persists its
  // data to server/data, so users, products and orders survive restarts.
  // mongodb-memory-server is used only to download the mongod binary;
  // we spawn and manage the process ourselves.
  console.log('No MONGO_URI set — starting embedded MongoDB (persistent)...');

  const { MongoBinary } = await import('mongodb-memory-server-core/lib/util/MongoBinary.js');
  const binaryPath = await MongoBinary.getPath({});

  const dbPath = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dbPath, { recursive: true });
  const port = Number(process.env.EMBEDDED_MONGO_PORT) || 27017;

  const mongod = spawn(
    binaryPath,
    ['--dbpath', dbPath, '--port', String(port), '--bind_ip', '127.0.0.1'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  // Don't let a dying API server orphan the database process
  const killMongod = () => {
    if (!mongod.killed) mongod.kill();
  };
  process.on('exit', killMongod);
  process.on('SIGINT', () => process.exit(0));
  process.on('SIGTERM', () => process.exit(0));

  await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(
      () => reject(new Error('Embedded MongoDB did not start within 30s')),
      30_000
    );

    mongod.stdout.on('data', (chunk) => {
      output += chunk.toString();
      // mongod logs "Waiting for connections" (log id 23016) once ready
      if (output.includes('"id":23016') || output.includes('Waiting for connections')) {
        clearTimeout(timeout);
        resolve();
      }
    });

    mongod.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    mongod.on('exit', (code) => {
      clearTimeout(timeout);
      const lastLines = output.trim().split('\n').slice(-5).join('\n');
      reject(new Error(`Embedded MongoDB exited with code ${code}.\n${lastLines}`));
    });
  });

  await mongoose.connect(`mongodb://127.0.0.1:${port}/rijisha`);
  console.log(`Embedded MongoDB running on port ${port} (data: ${dbPath})`);
}
