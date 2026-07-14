# Rijisha Jewellers — MERN Stack

Full-stack e-commerce site for handcrafted 925 sterling silver earrings and necklaces.

## Stack

- **MongoDB** — product catalog, users, wishlists, orders (via Mongoose)
- **Express** — REST API (`server/`)
- **React 19 + Vite** — storefront (`client/`)
- **Node.js** — runtime

## Run it

```bash
npm run dev        # starts API (port 5000) + React app (port 5173) together
```

Then open **http://localhost:5173**.

Or run each side separately: `npm run server` / `npm run client`.

## Database

No setup needed: with `MONGO_URI` empty in `server/.env`, the API auto-starts an
embedded MongoDB that stores its data in `server/data/`, so products, users and
orders persist across restarts. The first launch downloads the MongoDB binary
(one-time, ~80 MB).

To use MongoDB Atlas or a locally installed MongoDB instead, set `MONGO_URI` in
`server/.env` and restart.

The product catalog is seeded automatically on first run (8 pieces).

## Features

- Product listing with category filter, search and sorting (`/shop`)
- Product detail pages with quantity picker, stock display, Buy Now
- User registration / login (JWT, bcrypt-hashed passwords)
- Wishlist saved to the user's account
- Cart persisted in localStorage
- Checkout with shipping form; orders priced and validated server-side
- Order history with status badges (`/orders`)

## API

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create account |
| POST | `/api/auth/login` | – | Log in |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/products` | – | List (`?category=&search=&sort=`) |
| GET | `/api/products/:slug` | – | Product detail |
| GET | `/api/wishlist` | ✓ | Wishlist products |
| POST | `/api/wishlist/:productId` | ✓ | Toggle wishlist |
| POST | `/api/orders` | ✓ | Place order |
| GET | `/api/orders/mine` | ✓ | My orders |

`static-version/` contains the original static HTML prototype.
