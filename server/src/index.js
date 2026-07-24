import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import { seedProducts } from './seed.js';
import { isProduction, uploadDir, validateEnv } from './config.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import wishlistRoutes from './routes/wishlist.js';
import homeCollectionRoutes from './routes/homeCollections.js';
import reviewRoutes from './routes/reviews.js';
import rewardRoutes from './routes/rewards.js';
import couponRoutes from './routes/coupons.js';

// Stop now if a secret is missing, rather than booting a half-configured shop
validateEnv();

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In production the storefront is served from this same origin, so browsers
// never make a cross-origin request and CORS does not apply. CLIENT_ORIGIN is
// only for a split deployment where the two live on different domains.
const corsOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];
if (!isProduction || process.env.CLIENT_ORIGIN) {
  app.use(cors({ origin: corsOrigins }));
}

app.use(express.json());
app.use(
  '/uploads',
  express.static(uploadDir, {
    // Customer-supplied files: never let a browser second-guess the type we set
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  })
);

app.get('/api/health', (req, res) => res.json({ status: 'ok', brand: 'Rijisha Jewellers' }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/home-collections', homeCollectionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/coupons', couponRoutes);

// Serve the built storefront from the same origin as the API, so rijisha.in
// serves both and api.js's relative '/api' calls just work.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // React Router owns the URL — hand any non-API path to index.html, otherwise
  // a refresh on /shop or /rewards 404s.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else if (isProduction) {
  console.warn(`No client build at ${clientDist} — run "npm run build" in client/`);
}

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

const PORT = process.env.PORT || 5000;

connectDB()
  .then(seedProducts)
  .then(() => {
    app.listen(PORT, () => console.log(`API ready on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
