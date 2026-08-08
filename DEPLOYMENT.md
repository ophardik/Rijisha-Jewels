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

---

## 8. Putting the shop on www.rijisha.com

**Live service:** `Rijisha-Jewels` (`srv-d9if39naqgkc73a0i3d0`), Oregon, free plan,
auto-deploys `main`, currently served at `https://rijisha-jewels.onrender.com`.

### 8.1 Read this before touching DNS

`rijisha.com` is **not parked — it is currently serving a Shopify store**:

```
www.rijisha.com.  CNAME  shops.myshopify.com   (+ an AAAA record)
rijisha.com.      A      23.227.38.65          ← Shopify
nameservers:      dns1/dns2.registrar-servers.com   ← Namecheap
```

Repointing these records takes that Shopify storefront offline for this domain
the moment DNS propagates. Confirm the Shopify store is genuinely being retired
before starting. If it still has live orders or paying traffic, cut over during
a quiet window — a DNS change is not instant to undo, because resolvers cache
the old answer for the length of the record's TTL.

Lower the TTL on both records to 300 seconds **a day before** the cutover. That
is the single thing that makes a rollback fast.

### 8.2 The free plan does support this

Custom domains and managed TLS certificates both work on Free instances. The
allowance is per workspace, not per service: **Hobby (the free workspace tier)
includes 2 custom domains.** `www.rijisha.com` plus the apex `rijisha.com` is
exactly 2, so the whole setup fits with nothing to pay. Domains beyond that cost
$0.25/month each.

Three free-tier consequences apply, in descending order of how much they matter:

**1. Password reset email is dead on Free.** Since September 2025, Render blocks
outbound traffic on SMTP ports 25, 465 and 587 from free web services. The app
sends through nodemailer over SMTP (`server/src/mailer.js`, port 587 by
default), so the connection cannot leave the instance. Deliverability does not
degrade — it fails outright, and a customer who forgets their password has no
route back into their account. This is the one thing that argues for a paid
instance. Two ways out:

- Upgrade the instance type to Starter, which lifts the block; or
- Switch `mailer.js` from SMTP to a provider's **HTTPS API** (Resend, SendGrid,
  Brevo all offer one). Port 443 is not blocked, so this works on Free. It is a
  contained change — one module, since every caller already goes through
  `sendMail`.

**2. The service sleeps after 15 minutes idle.** The first visitor after a sleep
waits 30–60 seconds on a blank screen and will assume the shop is broken.
`.github/workflows/keep-awake.yml` already pings every 10 minutes to prevent
this. Note the arithmetic: the workspace gets 750 free instance hours per month
and keeping one service awake around the clock burns ~730 of them, so this only
works for a single free service and leaves no margin for a second.

**3. The filesystem is ephemeral.** Not a problem here — `server/src/storage.js`
pushes uploads to Cloudinary and stores the returned URL, so the instance holds
no files worth keeping. This supersedes §5 for the Cloudinary path; just confirm
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are
actually set in the dashboard, because without them `storage.js` silently falls
back to local disk and the photos start evaporating on every deploy again.

### 8.3 Order of operations

DNS must be cut over *before* `PUBLIC_URL` changes. Reversing these two steps
sends password-reset emails pointing at a domain that does not resolve yet.

1. **Stay on Free** — no plan change is needed to attach the domain. Settle the
   password-reset question from §8.2 separately; it does not block the cutover.
2. **Add the domain in Render first, DNS second.** Settings → Custom Domains →
   add `www.rijisha.com`. Render automatically adds the apex `rijisha.com` and
   redirects it to the www version, so www stays canonical. Adding it here first
   means the TLS certificate is ready to issue the instant DNS resolves.
3. **Update DNS at Namecheap** (Domain List → Manage → Advanced DNS). Replace,
   do not duplicate, the Shopify records:

   | Host | Type | Value |
   |---|---|---|
   | `www` | CNAME | `rijisha-jewels.onrender.com` |
   | `@` | ALIAS (or A) | `rijisha-jewels.onrender.com` (or `216.24.57.1`) |

   Delete the existing Shopify `A`/`CNAME` records **and the AAAA record on
   `www`** — Render is IPv4-only, and a stale AAAA record leaves IPv6-capable
   visitors hitting Shopify while everyone else sees the new site. That failure
   looks intermittent and wastes hours.

4. **Wait for Render to verify** the domain and issue the certificate. Both
   entries in Custom Domains must show verified with TLS before continuing.
5. **Then set `PUBLIC_URL`** to `https://www.rijisha.com` (Environment tab).
   This triggers a redeploy. Nothing else in the app hardcodes the domain.
6. Leave `CLIENT_ORIGIN` **unset**. One service serves both the API and the
   built storefront from the same origin, so no CORS entry is needed. Setting it
   turns CORS on for no reason.
7. Set **Health Check Path** to `/api/health` — it is currently blank on the
   live service, so Render cannot tell a booted instance from a broken one.

### 8.4 Verify

```bash
curl -I https://www.rijisha.com/            # 200, valid certificate
curl -I https://rijisha.com/                # 301 → https://www.rijisha.com
curl -s  https://www.rijisha.com/api/health # {"status":"ok",...}
```

Then load the site and hard-refresh on a deep link such as `/shop` — that
exercises the React Router catch-all in `server/src/index.js`. Finally, run one
real password reset and confirm the emailed link points at `www.rijisha.com`.

### 8.5 Rollback

Restore the two Shopify records (`www` CNAME `shops.myshopify.com`, apex `A`
`23.227.38.65`). Recovery takes as long as the TTL that was in effect when the
change was made — which is why §8.1 lowers it first.

### 8.6 Loose ends

- `.github/workflows/keep-awake.yml` pings `rijisha-jewels.onrender.com`. Leave
  it on that URL — it deliberately bypasses DNS and the apex redirect. Once the
  service is on a paid plan it no longer sleeps, so the workflow can be deleted.
- `MAIL_FROM` should be an address at a domain whose SPF/DKIM records authorise
  the SMTP provider. Pointing the domain at Render does nothing for email — if
  `MAIL_FROM` becomes `@rijisha.com`, that domain needs its own SPF/DKIM setup
  or reset emails will land in spam.
- `render.yaml` does not describe the live service (see the note at its top).
