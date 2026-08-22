# Archive District — Designer Resale CRM

A working full-stack app for Archive District (Chrome Hearts-heavy
streetwear/accessories resale). It covers the
storefront, checkout, a "sell to us" client intake flow with an authenticity
checklist, and an admin back office for inventory, submissions, orders,
reporting, and clients — including a real (installable) PWA shell and Web
Push notifications.

Built with Next.js 14 (App Router) + TypeScript, Tailwind CSS, Prisma +
PostgreSQL, NextAuth (Credentials/JWT), Stripe, and `web-push`.

Styled to the locked Archive District brand: Ink/Bone/Hazard palette,
Archivo Black + Archivo + IBM Plex Mono type (`tailwind.config.ts`,
`src/app/globals.css`). Full spec — palette, marks, voice — lives in the
`brand-identity` doc in the Resell Business project.

## Local development

You need a Postgres database to point `DATABASE_URL` at — two easy options:

**Option A — Neon dev branch (recommended, zero local install):** create a
free project at [neon.tech](https://neon.tech), copy its connection string
into `.env` as `DATABASE_URL`. Create a second branch called `dev` in the
Neon console (Branches → New branch) and use *that* branch's connection
string locally, so local work never touches the same data as production.

**Option B — local Postgres:** `createdb archive_district` (Postgres 14+),
then set `DATABASE_URL="postgresql://<user>:<password>@localhost:5432/archive_district"`
in `.env`.

Either way:

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL, NEXTAUTH_SECRET
npx prisma generate
npx prisma migrate dev      # applies prisma/migrations/ to your database
npm run seed                 # seeds demo users, inventory, submissions, orders
npm run dev                   # http://localhost:3000
```

Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.

## Demo login credentials

Seeded by `prisma/seed.ts` — the password is the same for every seeded user:

| Role   | Email                | Password      |
|--------|-----------------------|---------------|
| Admin  | admin@example.com     | password123   |
| Client | client1@example.com   | password123   |
| Client | client2@example.com   | password123   |
| Client | client3@example.com   | password123   |

**Change these before this ever touches a real deployment.** This is a demo
password baked into seed data for local/prototype use only.

## What's implemented vs. not yet

| Area | Status |
|---|---|
| Admin inventory CRUD + computed margins | ✅ Full CRUD, list with filters/search, edit form, computed margin (not stored) shown on list + detail |
| Sell-to-us intake + review | ✅ Client submission form (multi-photo), admin queue by status, status updates, make/accept offer, "convert to inventory" (creates a real Item + copies photos) |
| Client storefront + checkout | ✅ Filterable shop grid, item detail, Buy Now → real Stripe Checkout **or** demo fallback (see below) |
| Cash/other manual payment logging | ✅ Admin order detail → "Log manual payment" (CASH/OTHER), marks order PAID + items SOLD, no Stripe involved |
| Reporting | ✅ Margin totals grouped by brand and by category, revenue-by-month table. (No chart library — kept as clean grouped tables per the brief's "chart is a bonus" note) |
| PWA installability | ✅ `manifest.json`, generated placeholder icons, registered service worker (`public/sw.js`), correct meta tags — installable in Chrome/Edge/Android; iOS Safari via "Add to Home Screen" |
| Web push | ✅ Real subscribe flow (`PushManager` + Notification permission) on `/account`, `PushSubscription` model, save-subscription API, admin "Send test push" button on `/admin/clients`, VAPID key generator script. Fails gracefully with a clear message if VAPID keys aren't set |
| Price-comp links | ✅ Pure URL-builder (no scraping) — "Check StockX" / "Check Grailed" links on admin item detail, open in new tab |
| Messaging | ✅ `Message` model tied to either an Order or a SellSubmission; simple threaded view + reply form on both client and admin detail pages |
| Authenticity checks | ✅ Brand-aware checklist (`src/lib/authenticity.ts` — generic points plus Chrome Hearts/Rick Owens/Supreme/Louis Vuitton/Gucci specifics) on both the sell-submission review page and the inventory edit page; saved as an audit-trail record (`AuthenticityCheck`, one per item or submission) with who reviewed it and when. Driving field (`authenticityStatus`) can now *only* be set by completing the checklist, not a free dropdown. Carries over automatically when a submission is converted to inventory. Flagged items are hard-excluded from the storefront query as a safety net. Checklists are a starting point based on common legit-check heuristics, not a certified authentication — see the in-app disclaimer |

Nothing here is a stub that silently does nothing — every checkbox above is
click-through-able in the running app with the seed data.

### Deliberately simplified

- **Stripe webhook** (`/api/webhooks/stripe`) exists but is a light-touch
  implementation: it only does something if you set `STRIPE_WEBHOOK_SECRET`
  and register the endpoint's public URL with Stripe. For the demo, order
  status is instead reconciled directly against the Checkout Session when
  the buyer lands back on the order confirmation page — simpler than
  standing up a public webhook URL for a local prototype, and correct for a
  single-server deployment. A production deployment behind a stable public
  URL should register the webhook for reliability (e.g. against network
  blips on redirect).
- **Reports** are grouped tables, not charts — the brief called a chart a
  "bonus if time allows"; tables were prioritized to keep the core feature
  set solid rather than partially working.
- **Photo storage** is base64 data URIs inlined in Postgres (see below) —
  intentional to avoid needing object storage for a v1, called out below as
  a likely first thing to swap once real inventory volume shows up.
- **Admin role check** happens in two places for defense in depth:
  `src/middleware.ts` (redirects non-admins away from `/admin/*` at the
  edge) and `requireAdmin()` server-side in every admin page/action (in
  case middleware is ever bypassed or misconfigured).

## Environment variables

See `.env.example` for the full list with inline comments. Summary:

| Variable | Required? | If omitted |
|---|---|---|
| `DATABASE_URL` | Yes | App won't start — Postgres connection string (Neon in production) |
| `NEXTAUTH_URL` | Yes | NextAuth callback base URL |
| `NEXTAUTH_SECRET` | Yes | Session JWTs won't sign correctly |
| `STRIPE_SECRET_KEY` | No | `/api/checkout` falls back to the **demo checkout** — order is marked PAID immediately, item marked SOLD, no Stripe call made |
| `STRIPE_PUBLISHABLE_KEY` | No | Only needed if you later add Stripe.js client-side elements; unused server-side |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | No | Push subscribe button and admin "send test push" show a clear error instead of crashing |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | Must mirror `VAPID_PUBLIC_KEY` — this is the client-exposed copy used by the browser's `PushManager` |
| `GOOGLE_VISION_API_KEY` | No | The "Find visual matches" button on an item's admin page shows a clear message instead of erroring |

### Demo checkout fallback (Stripe)

`STRIPE_SECRET_KEY` is blank by default in this prototype. With it blank,
clicking **Buy now** on `/shop/[id]`:

1. Creates a `PENDING` Order + `OrderItem`.
2. Immediately marks the order `PAID` (tender `CARD`) and the item `SOLD`,
   **without calling Stripe** — this is the demo fallback, logged clearly
   with a banner on the resulting order page.

To switch to live Stripe:

1. Create a Stripe account, grab **test** keys from the dashboard.
2. Set `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` in `.env`.
3. Restart the dev server. `/api/checkout` will now create a real Stripe
   Checkout Session and redirect the buyer there instead.
4. (Optional, for production reliability) set `STRIPE_WEBHOOK_SECRET` and
   register `https://yourdomain.com/api/webhooks/stripe` as a webhook
   endpoint in the Stripe dashboard, subscribed to
   `checkout.session.completed`.

### Web Push (VAPID)

Push is fully wired but needs a keypair to actually send anything:

```bash
npm run vapid:generate
```

This prints `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` — paste all four into `.env` and restart the
dev server. Then:

- On `/account`, click **Enable push notifications** (as a signed-in user)
  — this requests browser Notification permission and POSTs the resulting
  subscription to `/api/push/subscribe`.
- On `/admin/clients`, any client with a saved subscription shows a **Send
  test push** button that calls `/api/push/send` (admin-only) and delivers
  a real push via `web-push` + your VAPID keys.

Without the keys set, both flows show a clear inline error instead of

throwing — nothing crashes.

### Visual match search (Google Cloud Vision)

This is a Google Lens-style companion to the plain-text StockX/Grailed
search links (`src/lib/priceComp.ts`) — it doesn't scrape either
marketplace, it calls Google's own paid Vision API and surfaces whichever
public pages come back:

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/),
   enable **billing** and the **Cloud Vision API**.
2. Create an API key (APIs & Services → Credentials) and restrict it to the
   Vision API only.
3. Set `GOOGLE_VISION_API_KEY` in `.env` and restart the dev server.

On an item's admin detail page, the **Find visual matches** button (next to
the existing StockX/Grailed links) sends the item's first photo to Vision's
Web Detection feature and lists back pages with a visually matching image —
StockX/Grailed hits sorted first, everything else after. This is billed per
lookup by Google (Web Detection is roughly $1.50 per 1,000 images at time
of writing) — unlike the free text-search links, so it's opt-in and off by
default. Without the key set, the button shows a clear message instead of
erroring.

## Photo uploads (prototype storage choice)

Photos are captured via `<input type="file">`, converted to base64 data
URIs **client-side** (`src/components/PhotoUpload.tsx`), and stored as a
plain `String` column (`Photo.dataUrl`) in Postgres. This means the entire
app — inventory photos, sell-submission photos — works with zero external
storage setup, which is fine to launch with.

**Move to real object storage once photo volume grows:**

1. Add an upload step (e.g. presigned S3 PUT, or a Cloudinary/Uploadthing
   SDK call) that returns a public URL instead of a data URI.
2. Change `PhotoUpload` to upload the file and collect the returned URL
   instead of `FileReader.readAsDataURL`.
3. `Photo.dataUrl` can keep its name (or rename to `url`) — no other schema
   change needed, since it's already just a string.

This matters because base64-in-Postgres doesn't scale forever: every photo
roughly 33% bloats the row size, and Neon's free/starter tiers cap storage —
fine for launch inventory, worth revisiting once you're photographing at
volume.

## Deploying to Vercel + Neon

The schema already targets Postgres and `prisma/migrations/` is checked in,
so this is just wiring accounts together — no code changes needed.

1. **Push this repo to GitHub** (if it isn't already):
   ```bash
   git remote add origin <your-empty-github-repo-url>
   git push -u origin master
   ```
2. **Neon:** create a project at [neon.tech](https://neon.tech) (or reuse an
   existing one). Note the connection string for its default branch — that's
   production. Optionally create a `dev` branch too, for local work.
3. **Vercel:** import the GitHub repo as a new project.
   - In the Vercel dashboard, install the **Neon integration**
     (Project → Integrations → Marketplace → Neon) and connect it to the
     Neon project from step 2. This sets `DATABASE_URL` for you and, as a
     bonus, gives every PR its own isolated Neon branch database
     automatically for preview deployments.
     Or skip the integration and just set `DATABASE_URL` manually under
     Project Settings → Environment Variables.
   - Set **Build Command** to `npm run vercel-build` (Project Settings →
     Build & Development Settings → override). This runs
     `prisma generate && prisma migrate deploy && next build` — migrations
     apply automatically on every deploy, before the app builds.
   - Set the rest of the environment variables (Production, and Preview if
     you want previews to work too):
     - `NEXTAUTH_URL` — your production URL (e.g. `https://archivedistrict.com`)
     - `NEXTAUTH_SECRET` — a fresh one, `openssl rand -base64 32` — never
       reuse the local dev value
     - `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` — once Stripe is ready;
       leave blank and the app keeps working in demo-checkout mode
     - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` /
       `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — run `npm run vapid:generate` once and
       paste the output in, if you want push notifications live
4. **Deploy.** Vercel builds, runs migrations against Neon, and the site is
   live on your `*.vercel.app` URL.
5. **Seed (optional, first deploy only):** seed data is for demoing, not for
   a real storefront — skip this once you're adding real inventory. If you
   do want it: `DATABASE_URL=<neon connection string> npm run seed` from
   your machine (or the Vercel CLI's `vercel env pull` to grab the URL
   first).
6. **Custom domain:** Project Settings → Domains → add
   `archivedistrict.com` (or whatever you land on), point its DNS at Vercel
   per the instructions Vercel shows, then update `NEXTAUTH_URL` to match
   and redeploy.

### Any other Node host

Same idea — set `DATABASE_URL` to your Postgres instance, run
`npm run vercel-build` (or `prisma migrate deploy && next build`
separately) as your build step, then `npm run start`. Nothing here is
Vercel-specific except the "Build Command override" mechanism itself.

## Project structure

```
src/
  app/                    Routes (App Router) — public, /account, /sell, /admin
    api/                  checkout, auth, push subscribe/send, stripe webhook
  components/             Shared UI (Navbar, PhotoUpload, MessageThread, ...)
  lib/                    prisma client, auth config, enums, format helpers,
                           price-comp URL builder, push + stripe helpers
  middleware.ts           Edge-level auth gate for /admin, /account, /sell
  types/next-auth.d.ts    Session/JWT type augmentation (id, role)
prisma/
  schema.prisma           Data model (see "Deploying" for the enum note)
  seed.ts                 Demo data generator
  placeholder-image.ts    Tiny solid-color PNG generator for seed photos
public/
  manifest.json, sw.js, icons/   PWA assets
scripts/
  generate-vapid-keys.mjs        npm run vapid:generate
  generate-icons.mjs             regenerate the placeholder PWA icons
```

## Verification performed

All of the following were run and passed before this was handed off:

1. `npm install` — clean install, no fatal errors.
2. Full authenticity-check flow exercised via a real headless browser
   (Playwright): logged in as admin, filled out and saved a checklist,
   confirmed the badge/reviewer attribution updated, then flagged an
   in-stock item and confirmed it disappeared from the storefront grid and
   its own detail page immediately.
3. **Postgres migration path, verified against a real local Postgres 16
   instance** (not just SQLite): `npx prisma migrate dev --name init`
   generated `prisma/migrations/`, applied cleanly; `npm run seed` populated
   4 users, 20 inventory items, 6 authenticity checks, 3 sell submissions,
   3 orders with zero errors.
4. `npm run vercel-build` (`prisma generate && prisma migrate deploy &&
   next build`) run **exactly as Vercel will run it**, against a freshly
   dropped-and-recreated Postgres database — migration applied, production
   build compiled with zero TypeScript errors, all 23 routes generated.
5. `npm run start` + curl checks against the Postgres-backed build — `/`,
   `/shop`, `/login`, `/register`, `/manifest.json`, `/sw.js` return 200;
   `/admin` and `/sell` correctly redirect (307) when signed out; after
   signing in via the real NextAuth credentials flow, `/admin/*` returns
   200 for the admin user and redirects a client user away; the full demo
   checkout flow was exercised end-to-end (buy → order created PENDING →
   auto-marked PAID → item marked SOLD → order detail page renders).
6. Visual QA via Playwright screenshots of the rebranded UI (shop grid,
   item detail, login) — caught and fixed a pre-existing layout bug where
   secondary product photos weren't stretching to fill their thumbnail grid
   cells (missing `w-full`).

## Known limitations (prototype scope)

- No image optimization/resizing on upload — large photos will bloat row
  size and slow page loads. Fine at launch inventory volume; revisit before
  onboarding hundreds of real listings (see "Photo uploads" above).
- No pagination on inventory/orders/submissions tables — fine at prototype
  scale, would need it once inventory grows past ~200 items.
- No email notifications (order confirmations, offer emails) — only in-app
  status changes, messaging, and web push. Would be a natural next addition
  (Resend/Postmark) once you have a domain to send from.
- Stripe webhook is present but optional/best-effort, as noted above.
