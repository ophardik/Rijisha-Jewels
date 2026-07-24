# Production Deployment Guide

Host: **Render** — one web service (`rijisha`, Singapore region) runs the API and
serves the built storefront from the same origin. Config lives in `render.yaml`;
secrets live only in the Render dashboard.

---

## 1. What the coupon-management change needs

**Nothing.** No new environment variables, no new dependencies, no migration.

The change added two routes (`PATCH`/`DELETE /api/coupons/:id`) and admin UI to
list and edit codes. It reuses the existing `CouponCode` collection and the
existing `protect` + `adminOnly` middleware. Existing coupon documents work
as-is — nothing to backfill.

Deploy is a normal push:

```bash
git add -A
git commit -m "Add coupon list, edit and delete to admin panel"
git push origin main
```

Render auto-deploys `main`, runs `npm run build` (installs server deps without
devDependencies, installs client deps, builds the Vite bundle), then `npm start`.
Watch the deploy log until the health check at `/api/health` goes green.

---

## 2. Verify after deploy

Log into the admin panel → Review Rewards:

1. Paste two throwaway codes → **Show codes** lists them as *Available*.
2. **Edit** one, save → renamed. Re-editing to an existing code should be
   refused with "That code is already in the pool".
3. **Delete** one → confirmation appears, then it disappears from the list.
4. Approve a real claim → its code flips to *Sent* and shows
   "Sent codes cannot be edited or deleted" with no buttons.
5. Delete the leftover test code.

Step 4 is the one that matters: a sent code must stay locked, because the
customer already holds that exact string.

---

## 3. Environment variables — verify these in the Render dashboard

The server refuses to boot in production if any required value is missing
(`server/src/config.js`), so a wrong value fails loudly rather than silently.

| Variable | Set where | Notes |
|---|---|---|
| `NODE_ENV` | `render.yaml` | Already `production`. |
| `MONGO_URI` | Dashboard (`sync: false`) | **Must be the production database.** See §4. |
| `JWT_SECRET` | Render-generated | Changing it logs every customer out. Don't rotate casually. |
| `ADMIN_EMAIL` | Dashboard | No default in code. |
| `ADMIN_PASSWORD` | Dashboard | No default in code. Use a real password manager entry. |
| `PORT` | Render sets it | Don't override. |
| `UPLOAD_DIR` | **Not currently set** | See §5 — this one is a live problem. |
| `CLIENT_ORIGIN` | Leave empty | Same-origin deploy needs no CORS. Only set it if you ever split the frontend onto another domain. |

---

## 4. Separate the development database from production

`server/.env.example` documents the intent — dev writes to `rijisha_dev`,
production writes to `rijisha`:

```
...mongodb.net/rijisha_dev   ← local
...mongodb.net/rijisha       ← production
```

**Confirm your local `server/.env` actually follows this.** If local `MONGO_URI`
points at the production database, every API call you make while developing —
every test coupon, every seeded product — writes into the live shop. The database
name is the segment after the last `/` in the connection string.

If they currently match, change the local one and re-run the seed against the dev
database. Leaving `MONGO_URI` empty locally is also fine: `db.js` falls back to a
zero-setup embedded MongoDB.

---

## 5. Review photos are wiped on every deploy

**This is the most important item in this document, and it is not caused by the
coupon change — it is pre-existing.**

`UPLOAD_DIR` is unset, so `config.js` falls back to `server/uploads`, which lives
*inside* the application directory. Render replaces that directory on every
deploy. `render.yaml` declares no persistent disk.

Consequence: every customer review photo uploaded since the last deploy is
destroyed by the next deploy. The entire reward flow depends on those photos —
a claim is only valid if the review has one, and you approve claims by looking at
them. After a deploy you would be approving claims whose evidence is gone.

Fix — add a disk to `render.yaml` and point `UPLOAD_DIR` at it:

```yaml
    disk:
      name: uploads
      mountPath: /var/data/uploads
      sizeGB: 1

    envVars:
      - key: UPLOAD_DIR
        value: /var/data/uploads
```

Caveats before you apply it:

- A Render disk requires a **paid instance type** — it is not available on the
  free plan. This is coupled to §6.
- Attaching a disk means the service can no longer scale past one instance.
  Fine for this shop; worth knowing.
- Photos already lost are not recoverable. Do this before promoting the shop,
  not after.

---

## 6. Move off the free plan before promoting the shop

`render.yaml` sets `plan: free`, which sleeps the service after 15 minutes of
inactivity. The first visitor after a sleep waits ~30-60 seconds for a cold
start, and will assume the site is broken. Switch to `starter` before you send
customers to the site — and note this is also what unlocks the disk in §5.

---

## 7. Pre-launch checklist

- [ ] Local `MONGO_URI` points at a *different* database than production (§4)
- [ ] Persistent disk attached and `UPLOAD_DIR` set (§5)
- [ ] Plan switched from `free` to `starter` (§6)
- [ ] `ADMIN_PASSWORD` is a strong value stored in a password manager
- [ ] Coupon pool has real Etsy codes in it — approving fails with an empty pool
- [ ] Coupon list / edit / delete verified in production (§2)
- [ ] Health check green at `/api/health`

---

## Rollback

Render keeps previous deploys. Dashboard → the service → **Deploys** → pick the
last good one → **Redeploy**. The coupon change is additive and touches no
existing documents, so rolling back needs no data cleanup — codes edited or
deleted through the new UI simply stay as they are.
