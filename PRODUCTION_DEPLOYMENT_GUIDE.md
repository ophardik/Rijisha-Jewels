# Rijisha Jewellers — Production Deployment Guide

A complete, from-scratch guide to putting this shop online: what to change first,
which host to pick (and why), free vs. paid, and the exact click-by-click process.

> There is also a `DEPLOYMENT.md` in this repo — that one is narrowly about the
> coupon-management feature. **This** document is the full production setup. Read
> this one first if you have never deployed the app.

---

## 0. How this app is built (read this first — it decides everything)

This is **one app, one server**:

```
┌─────────────────────────────────────────────┐
│  Render Web Service  (single Node process)  │
│                                              │
│   Express (server/)                          │
│    ├─ /api/*        → the API + MongoDB      │
│    ├─ /uploads/*    → customer review photos │
│    └─ everything else → serves client/dist   │
│                       (the built React app)  │
└─────────────────────────────────────────────┘
             │                    │
        MongoDB Atlas        Persistent Disk
        (the database)       (review photos)
```

`server/src/index.js` serves the built React bundle from the **same origin** as
the API. So the browser only ever talks to one URL — no CORS, no second domain.

**Why this matters for choosing a host:** because the Express server is a
*long-running process* that also *writes uploaded files to disk*, you need a host
that runs a persistent Node server with an attached disk. That is Render's model.
It is **not** Vercel's model (see §2).

---

## 1. Recommended setup (the short answer)

| Piece | Use | Cost |
|---|---|---|
| **Web hosting** | **Render** — Web Service, Singapore region | **Free** to try, **Starter ($7/mo)** for a real shop |
| **Database** | **MongoDB Atlas** — M0 cluster | **Free** (512 MB, fine to launch) |
| **Review-photo storage** | **Render Persistent Disk** (1 GB) | ~**$0.25/mo**, *requires the paid plan* |
| **Domain** | e.g. `rijisha.in` from any registrar | ~$10/yr (optional; Render gives you a free `*.onrender.com` URL) |

**Bottom line for a live shop: budget about $7/month.** You *can* launch entirely
free, but with two real drawbacks that make the free tier unsuitable for paying
customers — see §3.

---

## 2. Render vs. Vercel — which and why

**Use Render. Do not use Vercel for this project as it is built today.**

| | **Render** ✅ | **Vercel** ⚠️ |
|---|---|---|
| Runs a long-lived Express server | Yes | No — it runs *serverless functions* that start and stop per request |
| Persistent uploaded files (review photos) | Yes, via a mounted disk | No — serverless filesystem is read-only/ephemeral; every photo would vanish |
| Serves the API + React from one origin | Yes, exactly how the code is written | Would need the app split into two projects |
| Fits this repo with zero code changes | Yes (`render.yaml` already exists) | No — needs re-architecting |

Vercel is excellent — but it is built for static sites and serverless functions.
This app is a stateful Node server that stores files. Forcing it onto Vercel would
mean splitting the frontend and backend apart and moving photo storage to an
external service (like Cloudinary or S3). That is real re-engineering for no
benefit here.

> **Good Vercel/Render-static combos exist** — you'd host the React build on
> Vercel and the Express API separately on Render, setting `CLIENT_ORIGIN` on the
> server. The code already supports this split (see the CORS block in
> `index.js`). But it's more moving parts, two dashboards, and two deploys. For a
> single shop, **one Render service is simpler and cheaper.** Skip it.

**Other solid single-service alternatives** (same model as Render, if you ever
want to compare): **Railway** and **Fly.io**. Render is the one this repo is
already configured for, so we'll use it.

---

## 3. Free vs. Paid — the honest trade-off

You can deploy 100% free. Here is exactly what "free" costs you:

### The two free-tier problems

1. **The site falls asleep.** Render's free web service sleeps after 15 minutes
   of no traffic. The next visitor waits **30–60 seconds** for it to wake up —
   they will assume the shop is broken and leave. (`render.yaml` currently says
   `plan: free`.)

2. **Review photos get deleted on every deploy.** The free plan cannot attach a
   persistent disk. Uploaded review photos are written *inside* the app folder
   (`server/uploads`), which Render wipes and rebuilds on every deploy. Since the
   whole rewards flow depends on those photos (you approve a reward claim by
   *looking at* the customer's review photo), losing them breaks the feature.
   This is the single most important reason to go paid.

### What paid ($7/mo Starter) fixes

- No sleeping → instant page loads for every visitor.
- Lets you attach a **Persistent Disk** so review photos survive deploys.

**Recommendation:**
- **Just testing / showing someone?** Free is fine.
- **Taking real customers?** Starter ($7/mo). Non-negotiable, mostly because of
  the photo-loss issue.

The database (Atlas M0) stays **free** either way and is plenty for launch.

---

## 4. What you must change / prepare BEFORE going live

Work through these in order. Items marked **(paid)** only apply once you're on the
Starter plan.

### 4.1 Create the production database (MongoDB Atlas)

1. Sign up at <https://www.mongodb.com/cloud/atlas> and create a **free M0**
   cluster (pick the Singapore/Mumbai region — closest to India).
2. **Database Access** → create a database user with a strong password.
3. **Network Access** → add `0.0.0.0/0` (allow from anywhere). Render's outbound
   IPs aren't fixed on lower plans, so this is the practical choice. Your data is
   still protected by the username/password.
4. **Connect** → *Drivers* → copy the connection string. It looks like:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxx.mongodb.net/rijisha?retryWrites=true&w=majority
   ```
5. **The database name matters.** The segment after the last `/` is the database.
   Use **`rijisha`** for production. Use a *different* name (e.g. `rijisha_dev`)
   in your local `server/.env`, so your local testing never writes into the live
   shop. (This is enforced by convention, not code — double-check it.)

### 4.2 Separate your local database from production ⚠️

Open your local `server/.env` and confirm its `MONGO_URI` does **not** point at
the same database you'll use in production. There is a saved memory noting that
local API testing has been writing to the live Atlas cluster — fix that here.
Options:
- Point local `MONGO_URI` at `.../rijisha_dev`, **or**
- Leave local `MONGO_URI` empty — the app auto-starts a zero-setup embedded
  MongoDB for development (`server/src/db.js`).

### 4.3 Decide your admin login

There are **no default admin credentials** in the code (on purpose — a default
would be public). The admin account is created on first startup from these env
vars. Pick a strong password and store it in a password manager:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### 4.4 Add a persistent disk for review photos **(paid)**

Edit `render.yaml` to attach a disk and tell the app to use it. Add these under
the `rijisha` service:

```yaml
    disk:
      name: uploads
      mountPath: /var/data/uploads
      sizeGB: 1

    envVars:
      # ...existing vars stay...
      - key: UPLOAD_DIR
        value: /var/data/uploads
```

`server/src/config.js` reads `UPLOAD_DIR` and writes photos there instead of the
throwaway `server/uploads`. Two things to know:
- A disk **requires the Starter plan** (not available on free).
- With a disk attached, the service can't auto-scale past one instance — totally
  fine for a single shop.

### 4.5 Switch off the free plan before launch **(paid)**

In `render.yaml`, change:

```yaml
    plan: free      # →
    plan: starter
```

### 4.6 Seed the coupon pool

The rewards flow hands out real discount codes from a pool. Approving a claim
fails if the pool is empty. Before launch, log into the admin panel and paste in
real codes (e.g. your Etsy discount codes).

---

## 5. The deployment process (step by step)

You'll deploy using Render's **Blueprint** feature, which reads the `render.yaml`
already in this repo.

### 5.1 Push your code to GitHub

Render deploys from a Git repo. If it isn't on GitHub yet:

```bash
# from the project root
git add -A
git commit -m "Prepare for production deployment"
# create an empty repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/rijisha-jewellers.git
git push -u origin main
```

(If `origin` already exists, just `git push origin main`.)

### 5.2 Create the service on Render

1. Sign up at <https://render.com> (log in with GitHub — easiest).
2. Dashboard → **New +** → **Blueprint**.
3. Connect your GitHub repo. Render detects `render.yaml` and shows the `rijisha`
   web service.
4. Click **Apply**. Render starts the first build.

### 5.3 Set the secret environment variables

`render.yaml` intentionally leaves secrets blank (`sync: false`) so they're never
committed. In the Render dashboard → your service → **Environment**, set:

| Variable | Value |
|---|---|
| `MONGO_URI` | Your Atlas string from §4.1 (ending in `/rijisha`) |
| `ADMIN_EMAIL` | Your admin email |
| `ADMIN_PASSWORD` | Your strong admin password |
| `UPLOAD_DIR` | `/var/data/uploads` (if you added the disk in §4.4) |

These are already handled for you and need no action:
- `NODE_ENV=production` — set in `render.yaml`.
- `JWT_SECRET` — Render auto-generates it. **Don't change it later** or every
  logged-in customer gets logged out.
- `PORT` — Render sets it automatically. Don't override.

> **Safety net:** the server *refuses to start* in production if any required
> secret is missing (`server/src/config.js` + `db.js`). So a misconfiguration
> fails loudly in the deploy log instead of silently serving a broken shop.

### 5.4 Watch the build

Render runs (from `render.yaml`):
- **Build:** `npm install && npm run build` — installs server deps (prod only),
  installs client deps, builds the Vite bundle into `client/dist`.
- **Start:** `npm start` — runs `node server/src/index.js`, which serves the API
  and the built React app.

Wait until the **health check** at `/api/health` goes green. Your shop is now
live at `https://rijisha.onrender.com` (or similar).

### 5.5 Add your custom domain (optional)

Render dashboard → your service → **Settings** → **Custom Domains** → add
`rijisha.in` (and `www.rijisha.in`). Render shows you the DNS records (a CNAME /
A record) to add at your domain registrar. HTTPS certificates are issued
automatically and free.

---

## 6. Verify after every deploy

1. Visit the site — homepage and product pages load.
2. Hit `https://your-url/api/health` — returns `{"status":"ok",...}`.
3. Log into the admin panel with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
4. Place a test order end-to-end.
5. Submit a review with a photo → confirm the photo displays. Then trigger a
   deploy and confirm the photo **still** displays (this proves the disk works).
6. Approve a reward claim → a coupon code flips from *Available* to *Sent*.

---

## 7. Ongoing: how to ship updates

Every future change is just:

```bash
git add -A
git commit -m "describe your change"
git push origin main
```

Render auto-deploys `main`, rebuilds, and swaps to the new version once the health
check passes. No downtime for the old version until the new one is healthy.

**Rollback:** Render keeps previous deploys. Dashboard → **Deploys** → pick the
last good one → **Redeploy**.

---

## 8. Cost summary

| | Free (testing) | Paid (real shop) |
|---|---|---|
| Render web service | $0 (sleeps after 15 min) | $7/mo (Starter, always on) |
| Persistent disk (photos) | ❌ not available | ~$0.25/mo (1 GB) |
| MongoDB Atlas | $0 (M0, 512 MB) | $0 (M0 is fine to launch) |
| Custom domain | optional | ~$10/yr at registrar |
| **Total** | **$0** | **≈ $7/month** |

---

## 9. Pre-launch checklist

- [ ] Atlas M0 cluster created; production DB named `rijisha`
- [ ] Atlas Network Access allows `0.0.0.0/0`
- [ ] Local `server/.env` points at a **different** DB than production (§4.2)
- [ ] `render.yaml` has the disk block + `UPLOAD_DIR` (§4.4)
- [ ] `render.yaml` plan switched `free` → `starter` (§4.5)
- [ ] `MONGO_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` set in Render dashboard
- [ ] `ADMIN_PASSWORD` is strong and saved in a password manager
- [ ] Coupon pool seeded with real codes
- [ ] Health check green at `/api/health`
- [ ] Photo-survives-deploy test passed (§6.5)
- [ ] Custom domain + HTTPS working (if using one)
```
