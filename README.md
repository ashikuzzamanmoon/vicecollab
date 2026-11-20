# GTA Creator Marketplace

A public marketplace where **GTA content creators** (YouTube, TikTok, Twitch, Kick,
Instagram) list their sponsorship packages and **brands / agencies** discover them,
send booking requests, and track deals. The platform takes a commission (default 15%)
on each deal.

This is the public Next.js version of the Idea 3 marketplace (a private operator
console MVP already exists as a separate prototype). Creators and brands sign up
themselves — nothing is hand-entered by the operator.

> **Not affiliated with Rockstar Games or Take-Two Interactive.** All branding is
> original styling inspired by the Vice City / Leonida vibe — no Rockstar assets,
> logos, or key art are used.

## Features

- **Public landing page + creator directory** — search, filters (platform, niche,
  audience country, price range), sort by followers, price, or rating.
- **Creator self-signup** — profile with platforms, follower counts, avg views,
  engagement rate, audience countries, niche tags, bio, portfolio links, and
  priced packages (Sponsored Short / Stream Mention / Dedicated Video / Custom).
- **Brand self-signup** — browse the directory, send booking requests (brief,
  package, deadline). Creators accept or decline within a **72-hour window**
  (live countdown shown).
- **Deal pipeline** — Requested → Accepted → In Production → Delivered → Paid,
  with per-deal message threads between brand and creator.
- **Commission tracking** — 15% default, shown on every booking and deal;
  admin-configurable (applies to new bookings only).
- **Reviews / ratings** — brands can rate a creator once a deal reaches Paid.
- **Dashboards** — creator (incoming requests, deals, earnings), brand
  (my bookings, spend), admin (verify creators, moderate listings, all deals,
  commission summary, settings).
- **Vice City design system** — dark neon theme (pink / magenta / purple / cyan,
  sunset gradients) applied consistently across every page.

## Payments — manual in v1 (read this)

There is **no automated escrow and no payment gateway** in v1, deliberately:

- Stripe is unavailable in Bangladesh.
- Paddle / Lemon Squeezy are merchants-of-record for digital products, not
  escrow marketplaces.

Instead, v1 does **manual payment coordination**: each deal records the agreed
price, the platform commission, the payment method the parties agreed on
(bank transfer / Payoneer / PayPal / other), and a manual payment status.
Money moves **outside the platform**; the brand marks the deal Paid once the
creator confirms receipt, and the commission is tracked on the deal for the
operator to settle.

The payments code is isolated in `lib/payments.ts` with a clearly-marked
`createCheckoutSession()` stub — when a gateway becomes available (e.g. Stripe
Connect), replace that stub and store the provider's session/payment id on the
Booking. Commission math and deal statuses stay the same.

## Tech stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Prisma 7** + PostgreSQL (Neon / Supabase free tier)
- **Auth.js v5** (NextAuth) — credentials (email/password) + optional Google OAuth
- No paid services. Deploys on Vercel.

## Getting started (local)

### Prerequisites

- Node.js 20+ and npm
- A free PostgreSQL database (Neon or Supabase — both have free tiers)

### 1. Install

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon/Supabase). Add `?sslmode=require` for hosted DBs. |
| `AUTH_SECRET` | Yes | Random secret — generate with `openssl rand -base64 32`. |
| `AUTH_URL` | Yes | `http://localhost:3000` locally; your production URL on Vercel. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Google OAuth. If unset, Google sign-in is hidden and only email/password works. |
| `NEXT_PUBLIC_APP_URL` | Yes | Same as `AUTH_URL`. |

### 3. Database

```bash
npx prisma migrate deploy   # apply the checked-in migration (or: npm run db:migrate to create/apply interactively)
```

### 4. (Optional) Sample data — local testing only

```bash
npm run db:seed
```

Creates clearly-marked SAMPLE accounts (it refuses to run with
`NODE_ENV=production`):

| Account | Email | Password |
|---|---|---|
| Admin | `admin@demo.local` | `Demo1234!` |
| Creator | `creator@demo.local` | `Demo1234!` |
| Brand | `brand@demo.local` | `Demo1234!` |

The production directory starts **empty** — no fake creator profiles are seeded
in production. Real creators sign up themselves.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000.

## First admin account

Registration never grants the ADMIN role. After creating your own account
(sign up as a creator or brand), promote it directly in the database:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

(or use `npx prisma studio` and edit the role). Sign out and back in for the
new role to take effect (roles live in the JWT session token).

## Deploy to Vercel

1. Push this repo to GitHub (or import the folder into Vercel directly).
2. In Vercel: **Add New → Project → Import** the repo. Framework preset:
   Next.js. No build settings need changing (`postinstall` runs
   `prisma generate` automatically).
3. Set the environment variables from `.env.example` in
   **Project Settings → Environment Variables** (use your production
   `DATABASE_URL`, a fresh `AUTH_SECRET`, and `AUTH_URL` /
   `NEXT_PUBLIC_APP_URL` = your `https://…vercel.app` URL).
4. Apply the migration to your production database once, from your machine:
   ```bash
   DATABASE_URL="<production-url>" npx prisma migrate deploy
   ```
5. Deploy. Promote your account to ADMIN with the SQL above (against the
   production database).

## Project structure

```
app/
  page.tsx                    Landing page
  creators/                   Public directory + creator profiles + booking page
  login/  register/           Auth pages (Auth.js credentials + Google)
  onboarding/                 Role picker for first-time sign-ins (esp. Google)
  dashboard/                  Role-aware overview, deals, profile management
  admin/                      Admin console (creators, deals, settings)
  api/auth/[...nextauth]/     Auth.js route handlers
components/                   Shared UI (ui.tsx), header/footer, feature components
lib/
  prisma.ts                   PrismaClient (Prisma 7 + PrismaPg adapter)
  auth-helpers.ts             requireSession / requireRole
  settings.ts                 Commission rate (admin-configurable)
  payments.ts                 Manual-payment module + commission math + gateway stub
  deal-helpers.ts             Deal pipeline helpers (shared server/client-safe)
  constants.ts                Platforms, niches, countries, package types
prisma/
  schema.prisma               Data model
  migrations/                 Checked-in SQL migrations
  seed.mjs                    LOCAL-ONLY sample data (never run in production)
prisma.config.ts              Prisma 7 CLI config (connection URL for Migrate)
```

## Key routes

| Route | Who | What |
|---|---|---|
| `/` | Public | Landing page |
| `/creators` | Public | Directory (search / filter / sort) |
| `/creators/[id]` | Public | Creator profile + packages + reviews |
| `/creators/[id]/book` | Brand | Send a booking request |
| `/login`, `/register` | Public | Sign in / sign up (creator or brand) |
| `/onboarding` | Signed-in, no profile | Pick a role, then create a profile |
| `/dashboard` | Creator / Brand / Admin | Role-aware overview |
| `/dashboard/deals` | Signed-in | My deals (list) |
| `/dashboard/deals/[id]` | Deal parties | Deal detail, messages, payment, review |
| `/dashboard/profile` | Creator / Brand | Edit profile + packages |
| `/admin` | Admin | Platform overview |
| `/admin/creators` | Admin | Verify / feature / publish creators |
| `/admin/deals` | Admin | All deals |
| `/admin/settings` | Admin | Commission rate |

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | `prisma migrate dev` (create + apply a migration) |
| `npm run db:push` | `prisma db push` (sync schema without a migration — dev only) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed LOCAL-ONLY sample data |

## Troubleshooting

- **`prisma generate` / `prisma migrate` fails downloading the schema engine**
  (network-restricted environments): download the engine binary manually and
  point Prisma at it:
  ```bash
  export PRISMA_SCHEMA_ENGINE_BINARY=/path/to/schema-engine
  ```
  Normal networks download it automatically on first use.
- **`DATABASE_URL` errors from Prisma CLI commands**: the CLI reads the
  connection URL from `prisma.config.ts`, which needs `DATABASE_URL` in the
  environment. Make sure `.env` exists, or export it inline:
  `DATABASE_URL="..." npx prisma migrate deploy`.
- **Role changes don't show up**: roles are stored in the JWT session — sign
  out and back in after changing a role in the database.
- **Google sign-in button missing**: set `GOOGLE_CLIENT_ID` and
  `GOOGLE_CLIENT_SECRET`. Without them, only email/password sign-in is shown.
