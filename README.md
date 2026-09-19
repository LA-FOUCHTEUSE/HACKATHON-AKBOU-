# TAWA3 - Backend

TAWA3 is a volunteer-matching platform connecting volunteers, organizations and sponsors in Algeria. This branch (`backend`) contains the backend foundation: a single Next.js application whose backend runs inside Next.js through Server Components, Server Actions and Route Handlers.

The frontend is being developed separately on the `front` branch and will be integrated later.

## Stack

- Next.js 16 (App Router), React 19, TypeScript (strict)
- PostgreSQL on Neon, Prisma 6.19 (`prisma db push`, no migrations)
- Zod validation, signed httpOnly session cookie (demo quick-login)
- next-intl: French (default), English, Arabic with full RTL
- Tailwind CSS v4 with logical properties only, shadcn/ui
- QR: `qrcode` (volunteer side), `html5-qrcode` with manual fallback (organization side)
- Payments are mocked behind a `PaymentProvider` interface (`MockEdahabiaProvider`); no real payment processing

Documentation:

- `docs/BACKEND_SPEC.md`: backend specification (source of truth)
- `docs/ARCHITECTURE.md`: architecture, decisions, API contracts, seed strategy, verification notes

## Status

| Area | Status |
|---|---|
| P0 (skeleton, schema, seed, quick login, role gating, volunteer and organization flows, QR check-in with fallbacks, attendance engine, gamification, i18n and RTL) | Implemented |
| P0 verification | Production build green, type check green, unit tests green, RTL check green; check-in API, Server Actions and signups tested over HTTP (see `docs/ARCHITECTURE.md`, Appendix C) |
| Database | Real Neon database connected, schema pushed, seeded; `seed:verify` passes |
| P1 (sponsor browse and checkout, donations, caisse, `/api/pay`, inbox, leaderboard, smoke test) | Implemented and verified against Neon (`npm run smoke`: 48 checks; API and pages tested over HTTP) |
| Vercel deployment | Pending |

Verified demo numbers: the demo volunteer goes from 680 points (rank 7 of 12, tier contributor) to 830 points (rank 6 of 12, tier committed) after one check-in.

## Local setup

Requirements: Node 22.

```bash
npm install                 # also runs prisma generate
cp .env.example .env        # then fill in the Neon URLs and a SESSION_SECRET
npm run db:push             # sync the schema (uses DIRECT_URL)
npm run db:seed             # reset and seed demo data
npm run seed:verify         # read-only checks, prints the demo rank before/after
npm run dev
```

Environment variables (`.env`, never committed):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled connection (`-pooler` host), used at runtime |
| `DIRECT_URL` | Neon direct connection, used by `prisma db push` |
| `SESSION_SECRET` | 32+ random characters, signs the session cookie |
| `NEXT_PUBLIC_APP_URL` | Public base URL |

## Scripts

| Script | Description |
|---|---|
| `dev`, `dev:https` | Development server (`dev:https` for camera testing on a phone over the local network) |
| `build`, `start` | Production build and server |
| `typecheck`, `lint`, `test` | TypeScript, ESLint, unit tests |
| `check:rtl` | Fails on physical Tailwind direction classes (`pl-`, `mr-`, `left-`, ...) |
| `db:push`, `db:seed`, `db:reset` | Schema sync and demo data (seed and reset wipe existing data) |
| `seed:verify` | Read-only verification of the seeded data |
| `smoke` | Scripted end-to-end DB checks (check-in, attendance, cancellation, payments, caisse, ranking); creates and removes its own fixtures |

## Demo accounts

Log in from `/fr/login` (no password in the demo): `benevole.demo@tawa3.dz` (volunteer), `org.demo@tawa3.dz` (organization), `sponsor.demo@tawa3.dz` (sponsor). Seeded check-in fallback code: `TAWA3-DEMO-7K2Q9XHM`.
