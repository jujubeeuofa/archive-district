# Archive District — Designer Resale CRM (Prototype)

A working full-stack MVP for a designer-resale business (Chrome Hearts-heavy
streetwear/accessories) run by a father-son team. It covers the storefront,
checkout, a "sell to us" client intake flow, and an admin back office for
inventory, submissions, orders, reporting, and clients — including a real
(installable) PWA shell and Web Push notifications.

Built with Next.js 14 (App Router) + TypeScript, Tailwind CSS, Prisma +
SQLite, NextAuth (Credentials/JWT), Stripe, and `web-push`.

## Quickstart

```bash
npm install
npx prisma generate
npx prisma db push       # creates prisma/dev.db from schema.prisma
npm run seed              # seeds demo users, inventory, submissions, orders
npm run dev                # http://localhost:3000
```

`.env` is already checked in with safe local defaults (SQLite path, a dev
`NEXTAUTH_SECRET`, and every optional key left blank). Copy `.env.example`
if you want to start from a clean template instead.

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
- **Photo storage** is base64 data URIs inlined in SQLite (see below) —
  intentional for a zero-infra prototype, called out below as the first
  thing to swap for production.
- **Admin role check** happens in two places for defense in depth:
  `src/middleware.ts` (redirects non-admins away from `/admin/*` at the
  edge) and `requireAdmin()` server-side in every admin page/action (in
  case middleware is ever bypassed or misconfigured).

## Environment variables

See `.env.example` for the full list with inline comments. Summary:

| Variable | Required? | If omitted |
|---|---|---|
| `DATABASE_URL` | Yes | App won't start — SQLite file path |
| `NEXTAUTH_URL` | Yes | NextAuth callback base URL |
| `NEXTAUTH_SECRET` | Yes | Session JWTs won't sign correctly |
| `STRIPE_SECRET_KEY` | No | `/api/checkout` falls back to the **demo checkout** — order is marked PAID immediately, item marked SOLD, no Stripe call made |
| `STRIPE_PUBLISHABLE_KEY` | No | Only needed if you later add Stripe.js client-side elements; unused server-side |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | No | Push subscribe button and admin "send test push" show a clear error instead of crashing |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | Must mirror `VAPID_PUBLIC_KEY` — this is the client-exposed copy used by the browser's `PushManager` |

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

## Photo uploads (prototype storage choice)

Photos are captured via `<input type="file">`, converted to base64 data
URIs **client-side** (`src/components/PhotoUpload.tsx`), and stored as a
plain `String` column (`Photo.dataUrl`) in SQLite. This means the entire
app — inventory photos, sell-submission photos — works with zero external
storage setup, which is the point for a local prototype.

**For production**, swap this for real object storage:

1. Add an upload step (e.g. presigned S3 PUT, or a Cloudinary/Uploadthing
   SDK call) that returns a public URL instead of a data URI.
2. Change `PhotoUpload` to upload the file and collect the returned URL
   instead of `FileReader.readAsDataURL`.
3. `Photo.dataUrl` can keep its name (or rename to `url`) — no other schema
   change needed, since it's already just a string.

This matters because base64-in-SQLite doesn't scale: every photo roughly
33% bloats the DB file, and SQLite isn't built for many concurrent writers
in production.

## Deploying

### Vercel (recommended for this stack)

1. Push this repo to GitHub.
2. Import into Vercel.
3. **Swap SQLite for a hosted Postgres** (Vercel's filesystem is
   ephemeral/read-only in production, so SQLite's file-based `dev.db`
   won't persist). Use [Neon](https://neon.tech) or
   [Supabase](https://supabase.com) — both have a free Postgres tier.

   In `prisma/schema.prisma`, change:

   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

   to:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

   That's the **entire** schema change — no model edits needed. (Note: the
   String-typed status/role fields in this schema were kept as `String`
   rather than Prisma `enum` because SQLite doesn't support native enums.
   On Postgres you *could* convert them back to real `enum` blocks for
   stronger DB-level constraints, but it's optional — the TypeScript union
   types in `src/lib/enums.ts` already give you type safety at the
   application layer.)

4. Set `DATABASE_URL` in Vercel's environment variables to your Neon/Supabase
   connection string.
5. Run `npx prisma db push` (or `migrate deploy`) against that URL once,
   then `npx tsx prisma/seed.ts` if you want the same demo data.
6. Set `NEXTAUTH_URL` to your production URL and generate a fresh
   `NEXTAUTH_SECRET` (`openssl rand -base64 32`) — don't reuse the dev one.
7. Add real `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` and VAPID keys
   if you want live payments and push in production.

### Any other Node host

Same steps — the only SQLite-specific thing is the `DATABASE_URL` file path
and the datasource `provider` line above. Everything else (NextAuth,
Stripe, web-push, PWA assets) is host-agnostic.

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
2. `npx prisma generate` + `npx prisma db push` — schema applies to a fresh
   `prisma/dev.db`.
3. `npm run seed` — completes without error, creates 4 users, 20 inventory
   items, 3 sell submissions, 3 orders.
4. `npm run build` — production build compiles successfully, **zero
   TypeScript errors**.
5. `npm run dev` + curl checks — `/`, `/shop`, `/login`, `/register`,
   `/manifest.json`, `/sw.js` return 200; `/admin` and `/sell` correctly
   redirect (307) when signed out; after signing in via the real NextAuth
   credentials flow, `/admin/*` returns 200 for the admin user and redirects
   a client user away; the full demo checkout flow was exercised end-to-end
   (buy → order created PENDING → auto-marked PAID → item marked SOLD →
   order detail page renders).

## Known limitations (prototype scope)

- No image optimization/resizing on upload — large photos will bloat the
  SQLite file and slow page loads. Fine for a handful of demo items; revisit
  before onboarding hundreds of real listings.
- No pagination on inventory/orders/submissions tables — fine at prototype
  scale, would need it once inventory grows past ~200 items.
- No email notifications (order confirmations, offer emails) — only in-app
  status changes, messaging, and web push. Would be a natural next addition
  (Resend/Postmark) once you have a domain to send from.
- Stripe webhook is present but optional/best-effort, as noted above.
