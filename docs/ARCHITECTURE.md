# TAWA3 - Backend Architecture

Status: architecture phase complete, implementation not started.
Branch: `backend`.
Primary source of truth: `docs/BACKEND_SPEC.md`. This document describes exactly how that specification will be implemented. Where this document and `BACKEND_SPEC.md` disagree, the disagreement is listed explicitly in section 2.4 (Conflicts) with the chosen resolution. Nothing else deviates.

---

## 1. Project objective

TAWA3 is a volunteer-matching platform connecting three roles:

- **Volunteers** discover campaigns, enroll, get checked in by QR at the event, earn points, climb tiers and a national ranking.
- **Organizations** (associations) create and manage campaigns, manage participants, scan volunteer QR codes, and follow their funding (caisse).
- **Sponsors** (companies) browse campaigns that need funding and buy a sponsorship pack through a mocked Edahabia payment. Individuals can donate on a public campaign page.

The deliverable is a single Next.js App Router application deployed on Vercel Hobby with PostgreSQL on Neon free tier. The backend lives inside Next.js (Server Components, Server Actions, Route Handlers, Prisma). French is the default and demo language; English and Arabic (full RTL) are supported.

The two demo-critical live flows are:

1. Volunteer enrolls -> shows QR -> organization scans (or types the token, or marks attended manually) -> points, tier and rank update on the volunteer profile.
2. Organization creates a campaign live -> it appears in the volunteer feed; organization cancels it -> enrolled volunteers receive an inbox notice.

---

## 2. Repository findings

### 2.1 What the repository contains (branch `main`, commit `0607c12`)

| Path | Nature | Relevance to backend |
|---|---|---|
| `README.md` | One-line title | None |
| `LICENSE` | License file | None (kept) |
| `.gitignore` | Standard Next.js gitignore (`node_modules`, `.next`, `.env`, `.env*.local`, `.vercel`, `next-env.d.ts`) | Reused as-is; already correct for this project |
| `ATHAR_Volunteer_Impact_Platform.md` (removed in the pre-integration cleanup) | Earlier concept document ("ATHAR"): mission lifecycle, check-in/check-out, impact passport, hours, Firebase/Firestore stack, AI mission generator, maps, admin role | Context only. Superseded by `BACKEND_SPEC.md` where they differ (see 2.4) |
| `designref/` (29 images: `.webp`, `.jfif`) | Visual references: Berber motifs, Islamic lanterns, Alhambra patterns, social-app screenshots | Frontend visual reference only. Not used by the backend |
| `testt.py` (removed in the pre-integration cleanup) | Stray test file | Irrelevant |

There is no `package.json`, no Next.js application, no Prisma schema, no source code. Remote has a single branch `main`.

### 2.2 What is irrelevant to the backend

Everything above except `.gitignore`. In particular the Firebase/Firestore data model, check-out flow, volunteer hours, AI features, maps, and the administrator role from the ATHAR concept document are **not** implemented, because `BACKEND_SPEC.md` does not include them. None of these files was modified during the build. Before frontend integration, the obsolete `ATHAR_Volunteer_Impact_Platform.md` and `testt.py` were removed and the project documentation moved to `docs/`.

### 2.3 Version facts checked on 2026-09-19 (npm registry)

| Package | Latest | Chosen | Reason |
|---|---|---|---|
| `next` | 16.3.5 | `16.3.x` | Spec: "latest stable" |
| `react` / `react-dom` | 19.3.0 | `19.x` | Required by Next 16 |
| `next-intl` | 4.14.5 | `4.14.x` | Spec: next-intl v4; peer range includes Next 16 |
| `prisma` / `@prisma/client` | 7.10.0 (8.0 in RC) | **`6.19.x`** | See conflict C1 |
| `zod` | 4.6.5 | `4.x` | Validation |
| `qrcode` | 1.5.4 | `1.5.x` | QR generation |
| `html5-qrcode` | 2.3.8 | `2.3.x` | QR scanning |
| `framer-motion` | 13.4.0 | `13.x` | Animation |
| `tailwindcss` | 4.3.3 | `4.x` | Styling (CSS-first config) |
| `tsx` | 4.23.x | `4.x` | Seed runner |
| Node | - | `22.x` | Spec section 4 |

### 2.4 Conflicts and resolutions

| # | Conflict | Resolution |
|---|---|---|
| C1 | Spec schema uses `url` + `directUrl` inside `datasource db`, generator `prisma-client-js`, and `new PrismaClient()` without an adapter. Prisma 7 removed `url`/`directUrl` from the schema (moved to `prisma.config.ts`) and requires driver adapters. | Pin **Prisma 6.19.x**, the last major where the spec's schema and singleton work verbatim. Spec text is implemented unchanged. |
| C2 | Spec folder lists `src/middleware.ts`. In Next 16 the file convention is renamed to `proxy.ts` (`middleware.ts` is deprecated). | Use `src/proxy.ts` with identical content (next-intl routing middleware). Same responsibility, new file name. |
| C3 | Spec asks for `eslint: { ignoreDuringBuilds: true }` in `next.config`. Next 16 no longer runs ESLint during `next build` and the `eslint` config key is removed, so adding it would be a TypeScript error in `next.config.ts`. | Omit the key. The spec's intent (lint can never block a deploy) is satisfied by default. `npm run lint` stays available separately. `typescript.ignoreBuildErrors` is **not** set. |
| C4 | Spec folder marks `org/scanner/page.tsx` as client ("camera QR scan (client)"), but role gating must run on the server. | `page.tsx` is a Server Component that calls `requireRole("ORGANIZATION")` and renders the `"use client"` `QrScanner` component. Camera code is 100% client. |
| C5 | Capacity rule "capacity remaining = capacity - count(ENROLLED)". Once a volunteer is marked ATTENDED their status leaves ENROLLED and the literal formula would reopen their seat. | Occupied seats = count(`ENROLLED`) + count(`ATTENDED`). Remaining = `capacity - occupied` (unlimited when `capacity = 0`). This is the only reading that keeps the spec's intent after check-in. |
| C6 | `CheckInToken.token` defaults to `cuid()` in the spec; the spec also says "opaque random token". A cuid is partly time-derived. | Schema keeps `@default(cuid())` unchanged. Application code always sets the token explicitly to `crypto.randomBytes(24).toString("base64url")` (32 chars, 192 bits). |
| C7 | Product name: `BACKEND_SPEC.md` says **TAWA3**, the repository concept document says **ATHAR**. | Use TAWA3 (spec is source of truth). The name only appears in i18n key `app.name`, so renaming is a one-line change per locale. |
| C8 | ATHAR concept: the association displays a mission QR and the volunteer scans it; check-out; hours. Spec: the volunteer shows a personal token QR and the organization scans it; no check-out; no hours. | Spec flow implemented. No check-out, no hours. |
| C9 | Spec section 6 requires a live volunteer signup flow but the spec folder tree has no volunteer onboarding page. Spec acceptance says the org "gets a notification" but there is no org inbox page. Spec section 8 asks for a leaderboard view but there is no page for it. Update of a campaign has no page. | Add exactly four pages: `volunteer/onboarding`, `org/inbox`, `leaderboard`, `org/campaigns/[id]/edit`. No other page is added. |

No conflict requires a data-model change. The Prisma schema is the spec schema verbatim (section 10).

---

## 3. Backend strategy

- One Next.js application at the repository root of the `backend` branch. No second server, no workers, no cron, no websockets.
- **Reads**: Server Components call typed query functions in `src/lib/*` that use Prisma directly. No REST layer for reads.
- **Mutations**: Server Actions in `src/actions/*` (default). Every action follows the same pipeline:
  1. authenticate (`getActor(role)`),
  2. authorize (ownership checks),
  3. validate input (Zod schema from `src/lib/validation.ts`),
  4. perform DB operations (Prisma; `$transaction` whenever more than one related write),
  5. revalidate affected paths (`src/lib/revalidate.ts`),
  6. return an `ActionResult<T>` (section 34).
- **Route Handlers** only where a non-form, cross-device JSON endpoint is genuinely useful: `POST /api/checkin` (scanner phone) and `POST /api/pay` (mock payment endpoint listed in the spec). Both are thin wrappers over the same library functions that Server Actions use.
- **Business rules live in `src/lib`**, never inside pages or actions: `lib/points.ts` (attendance + gamification), `lib/checkin.ts` (token issue/redeem), `lib/contributions.ts` (payments -> sponsorship/donation), `lib/caisse.ts` (funding totals). Actions and route handlers only orchestrate.
- Everything that reads cookies or the DB is dynamic (section 33).

---

## 4. Branch strategy

- `main`: default branch, owned by the frontend teammate. Backend work is **never** pushed to `main` directly.
- `backend`: created from `main` at `0607c12`. All backend work lives here.
- Commits are small and conventional (`feat:`, `fix:`, `chore:`, `docs:`), authored with the developer's own git identity, no co-author or tool attribution trailers.
- Integration plan (to avoid conflicts):
  1. Push the `backend` skeleton (Next.js + Prisma + i18n + login) within the first hour so the frontend teammate can branch from or rebase onto it. The skeleton establishes the folder layout; UI work then happens inside `src/components/*` and page JSX.
  2. Backend owns: `prisma/`, `src/lib/`, `src/actions/`, `src/app/api/`, `src/i18n/`, `src/proxy.ts`, `next.config.ts`, `package.json` scripts, data-loading and gating at the top of each `page.tsx`.
  3. Frontend owns: `src/components/**` visual components, styling in `page.tsx` JSX, `src/app/globals.css`, `public/` images, message wording.
  4. Merge into `main` only through a pull request, after both sides agree, with `npm run build` green.
- Existing files on `main` are not modified. `.gitignore` already fits.

---

## 5. Technology stack

| Layer | Choice | Where |
|---|---|---|
| Framework | Next.js 16 App Router, React 19 | whole app |
| Language | TypeScript `strict: true` | `tsconfig.json` |
| Styling | Tailwind CSS v4 + shadcn/ui, logical properties only | `src/app/globals.css`, `src/components/ui` |
| Animation | framer-motion 13 (enroll button, result card) | client components only |
| i18n | next-intl 4, `[locale]` segment, locales `fr` (default), `en`, `ar` | `src/i18n`, `src/messages`, `src/proxy.ts` |
| Database | PostgreSQL on Neon free tier (pooled runtime URL, direct URL for `db push`) | env |
| ORM | Prisma 6.19 (`prisma-client-js`) | `prisma/schema.prisma`, `src/lib/prisma.ts` |
| Validation | Zod 4 (server), react-hook-form + `@hookform/resolvers` (client forms) | `src/lib/validation.ts` |
| Session | HMAC-SHA256 signed httpOnly cookie via `cookies()` from `next/headers` | `src/lib/session.ts` |
| QR generate | `qrcode` rendered to SVG/canvas in a client component | `src/components/volunteer/CheckInQr.tsx` |
| QR scan | `html5-qrcode` (dynamically imported in `useEffect`) | `src/components/org/QrScanner.tsx` |
| Icons | `lucide-react` | UI |
| Server-only guard | `server-only` package imported at top of every server module | `src/lib/*` (server modules) |
| Seed runner | `tsx` | `prisma/seed.ts` |

Not used (spec section 1 CUT list and user instructions): Express or any separate server, NextAuth, Three.js, websockets/realtime, email sending, file uploads, real SATIM/Edahabia, Redux, TanStack Query, Zustand (scanner state fits in `useState`; Zustand is only added if that proves insufficient), Prisma migrations.

---

## 6. Application structure

```
Browser (volunteer phone)            Browser (organization phone)
   |  RSC pages + Server Actions        |  RSC pages + Server Actions + fetch("/api/checkin")
   v                                    v
+-------------------------------------------------------------------+
| Next.js on Vercel (serverless functions, region fra1)             |
|  src/proxy.ts          locale routing (next-intl)                 |
|  src/app/[locale]/*    Server Components: gate + read + render    |
|  src/actions/*         Server Actions: auth, validate, mutate     |
|  src/app/api/*         Route Handlers: checkin, pay               |
|  src/lib/*             domain logic, Prisma, session, i18n utils  |
+-------------------------------------------------------------------+
   | pooled DATABASE_URL (Neon pgbouncer)
   v
PostgreSQL on Neon (eu-central-1)
```

Layering rule: `app` and `actions` may import `lib`; `lib` never imports `app` or `actions`; `components` marked `"use client"` may import only client-safe modules (`lib/tiers.ts`, `lib/domains.ts`, `lib/constants.ts`, `lib/utils.ts`, `lib/result.ts` types, `i18n/navigation.ts`) and may receive Server Actions as props or import them from `src/actions/*` (allowed: action modules are `"use server"`).

---

## 7. Exact folder tree

Files marked `(existing)` are untouched. Everything else is created on the `backend` branch.

```
.
├── .env.example
├── .gitignore                         (existing, unchanged)
├── .nvmrc                             22
├── LICENSE                            (existing)
├── README.md                          project status and setup
├── designref/                         (existing, frontend visual references)
├── docs/
│   ├── ARCHITECTURE.md
│   └── BACKEND_SPEC.md
├── components.json                    shadcn config
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                        wipes + inserts, idempotent
│   ├── seed-data.ts                   French seed content (orgs, campaigns, volunteers, sponsors)
│   └── verify-seed.ts                 read-only seed checks: ledger invariant, demo rank before/after
├── public/
│   └── campaigns/                     optional static cover images; null = color block placeholder
├── scripts/
│   └── smoke.ts                       P1 only: scripted DB smoke test (section 38)
└── src/
    ├── proxy.ts                       next-intl routing (spec: middleware.ts, see C2)
    ├── i18n/
    │   ├── routing.ts                 defineRouting({ locales: ["fr","en","ar"], defaultLocale: "fr" })
    │   ├── request.ts                 getRequestConfig: messages (fr fallback merge), timeZone Africa/Algiers
    │   └── navigation.ts              createNavigation(routing): Link, redirect, useRouter, usePathname
    ├── messages/
    │   ├── fr.json
    │   ├── en.json
    │   └── ar.json
    ├── app/
    │   ├── globals.css
    │   ├── [locale]/
    │   │   ├── layout.tsx             <html lang dir>, NextIntlClientProvider, SiteHeader
    │   │   ├── page.tsx               landing
    │   │   ├── not-found.tsx
    │   │   ├── error.tsx              "use client" error boundary
    │   │   ├── login/page.tsx         quick-login
    │   │   ├── leaderboard/page.tsx   top 20 national (C9)
    │   │   ├── campaigns/page.tsx     public feed
    │   │   ├── campaigns/[id]/page.tsx        detail + donate form
    │   │   ├── volunteer/
    │   │   │   ├── onboarding/page.tsx        live signup (C9)
    │   │   │   ├── feed/page.tsx
    │   │   │   ├── profile/page.tsx
    │   │   │   ├── inbox/page.tsx
    │   │   │   └── checkin/[campaignId]/page.tsx
    │   │   ├── org/
    │   │   │   ├── onboarding/page.tsx
    │   │   │   ├── dashboard/page.tsx
    │   │   │   ├── inbox/page.tsx             (C9)
    │   │   │   ├── campaigns/page.tsx         list + create form
    │   │   │   ├── campaigns/[id]/edit/page.tsx          (C9)
    │   │   │   ├── campaigns/[id]/participants/page.tsx
    │   │   │   ├── scanner/page.tsx           server gate + client scanner (C4)
    │   │   │   └── caisse/page.tsx
    │   │   └── sponsor/
    │   │       ├── browse/page.tsx
    │   │       └── checkout/[campaignId]/page.tsx
    │   └── api/
    │       ├── checkin/route.ts       POST { token }
    │       └── pay/route.ts           POST sponsorship | donation
    ├── actions/                       all files start with "use server"
    │   ├── auth.ts                    loginAs, logoutAction
    │   ├── onboarding.ts              signupVolunteer, signupOrganization
    │   ├── enrollment.ts              enroll, withdraw
    │   ├── favorites.ts               toggleFavorite
    │   ├── checkin.ts                 issueCheckInToken
    │   ├── notifications.ts           markRead, markAllRead
    │   ├── campaigns.ts               createCampaign, updateCampaign, deleteCampaign (= cancel)
    │   ├── participants.ts            addParticipantByName, removeParticipant, markAttendedManually
    │   └── contributions.ts           purchaseSponsorship, donate
    ├── lib/
    │   ├── prisma.ts                  singleton (spec verbatim) + "server-only"
    │   ├── session.ts                 login, logout, getCurrentUser, requireRole, getActor
    │   ├── points.ts                  awardAttendance (single source of truth), getNationalRank, getLeaderboard
    │   ├── tiers.ts                   TIERS table + getTier/getTierProgress (pure, client-safe)
    │   ├── ranking.ts                 national ranking order + rank query (pure; shared with prisma/verify-seed.ts)
    │   ├── checkin.ts                 issueToken, redeemToken
    │   ├── payments.ts                PaymentProvider, MockEdahabiaProvider, payments (spec verbatim)
    │   ├── contributions.ts           processSponsorship, processDonation
    │   ├── caisse.ts                  getFundingTotals, getOrgCaisse
    │   ├── notifications.ts           notify, notifyMany, NOTIFICATION_KEYS
    │   ├── campaigns.ts               feed/detail/dashboard queries, occupied-seat logic, campaign phase
    │   ├── volunteers.ts              profile stats, findVolunteersByName
    │   ├── domains.ts                 ACTIVITY_DOMAINS list + i18n keys (pure, client-safe)
    │   ├── validation.ts              every Zod schema
    │   ├── result.ts                  ActionResult type, ErrorCode list, ok(), fail() (client-safe)
    │   ├── errors.ts                  DomainError, toFailure(), HTTP status map (server-only)
    │   ├── action.ts                  runAction() wrapper + parse() helper for Server Actions (server-only)
    │   ├── dates.ts                   Algeria-time conversion for datetime-local inputs (client-safe)
    │   ├── revalidate.ts              named revalidation groups
    │   ├── constants.ts               TOKEN_TTL_MINUTES, ALLOW_WALK_IN, limits (client-safe)
    │   ├── utils.ts                   cn() for shadcn (client-safe)
    │   ├── rewards.ts                 P2 only: static rewards catalog (client-safe)
    │   └── tiers.test.ts              unit tests (node:test via tsx)
    └── components/
        ├── ui/                        shadcn primitives (button, card, input, label, textarea, badge, checkbox, separator)
        ├── forms/                     Field + FormError ("use client"), DomainPicker ("use client")
        ├── layout/                    SiteHeader (server: role nav + unread badge), LanguageSwitcher ("use client")
        ├── campaigns/                 CampaignCard, DomainBadge, FundingProgress,
        │                              EnrollButton ("use client", useOptimistic), FavoriteButton ("use client", useOptimistic),
        │                              CampaignForm ("use client", create + edit)
        ├── volunteer/                 CheckInQr ("use client"), TierProgress, SignupForm ("use client")
        ├── org/                       QrScanner ("use client": camera + manual token form + result card),
        │                              ParticipantActions ("use client"), AddParticipantForm ("use client"),
        │                              OrgCampaignRow, CancelCampaignButton ("use client"), OrgSignupForm ("use client")
        ├── sponsor/                   P1: PackCard, CheckoutForm ("use client")
        ├── donations/                 P1: DonateForm ("use client")
        └── notifications/             InboxList (server, renders keys + params), MarkReadButtons ("use client")
```

---

## 8. Server / client boundaries

| Module kind | Directive | May import | Must never import |
|---|---|---|---|
| `src/lib/prisma.ts`, `session.ts`, `points.ts`, `checkin.ts`, `payments.ts`, `contributions.ts`, `caisse.ts`, `notifications.ts`, `campaigns.ts`, `volunteers.ts`, `revalidate.ts` | `import "server-only"` at top | Prisma, `next/headers`, `node:crypto` | anything client |
| `src/lib/tiers.ts`, `domains.ts`, `constants.ts`, `utils.ts`, `result.ts` | none (pure) | `import type` from `@prisma/client` only | Prisma runtime, `next/headers` |
| `src/lib/validation.ts`, `ranking.ts` | none (pure) | zod / `import type` from `@prisma/client` | Prisma runtime |
| `src/lib/errors.ts` | `import "server-only"` | `Prisma` error classes | - |
| `src/actions/*` | `"use server"` | `lib/*` | client components |
| `src/app/**/page.tsx`, `layout.tsx` | Server Component (default) | `lib/*`, `actions/*`, components | - |
| `src/app/api/**/route.ts` | server | `lib/*` | - |
| `src/components/**` with state/effects/browser APIs | `"use client"` | client-safe lib, `actions/*` (as RPC), `i18n/navigation` | `lib/prisma`, `lib/session`, `next/headers`, `fs` |

Rules:

- Prisma enum *values* needed on the client (domain list, statuses) come from `lib/domains.ts` / `lib/constants.ts` string arrays typed with `satisfies readonly ActivityDomain[]` using `import type`. No runtime import of `@prisma/client` in client bundles.
- `server-only` makes an accidental client import fail the build instead of leaking to the browser.
- `QrScanner` and `CheckInQr` are client components; `html5-qrcode` is loaded with `await import("html5-qrcode")` inside `useEffect` so it never executes during SSR.
- Server Components pass only serializable props (dates as ISO strings or `Date` objects supported by RSC; no Prisma `Decimal` exists in this schema).

---

## 9. Database architecture

- Engine: PostgreSQL 17 on Neon free tier, region `aws-eu-central-1` (Frankfurt, closest to Algeria and to Vercel `fra1`).
- Connections:
  - Runtime (`DATABASE_URL`): Neon **pooled** host (`-pooler`), PgBouncer transaction mode. Query string `?sslmode=require&pgbouncer=true&connect_timeout=15`. `pgbouncer=true` disables Prisma prepared-statement caching, which is the documented safe setting for PgBouncer; `connect_timeout=15` absorbs Neon cold starts.
  - Schema operations (`DIRECT_URL`): Neon **direct** host, used by `prisma db push` and by the seed.
- Client: one `PrismaClient` per serverless instance via the spec singleton (`globalThis` cache in development).
- Schema workflow: `prisma db push` locally against Neon, then `prisma db seed`. No migrations folder. Vercel only runs `prisma generate` (postinstall) and `next build`.
- Interactive transactions (`prisma.$transaction(async (tx) => ...)`) are used for multi-step logic with reads that decide writes. Options: `{ maxWait: 10_000, timeout: 15_000 }` to tolerate cold starts. Interactive transactions work over PgBouncer transaction mode because the whole transaction is pinned to one server connection.
- Money is integer DZD everywhere (`Int`). Points are integers.
- Derived values are computed on read at demo scale: remaining capacity, funding totals, national rank, tier. The only cached aggregates are the spec's `VolunteerProfile.totalPoints` and `eventsCompleted`, always updated inside the same transaction as the ledger row.
- Referential behaviour: default Prisma relation mode (foreign keys, `onDelete: Restrict` by default). Nothing is hard-deleted by the application: campaign delete is a soft cancel, participant removal sets `WITHDRAWN`, favorites are the only hard delete (leaf row). The seed wipes tables leaf-first.
- Indexes: exactly the spec's `@id`, `@unique` and `@@unique` constraints. No additional indexes are added (demo scale; spec defines none). Candidate indexes if needed later: `Notification(userId, read)`, `Enrollment(campaignId, status)`, `Campaign(status, createdAt)`.

---

## 10. Complete Prisma model and relationships

### 10.1 `prisma/schema.prisma` (spec section 5 verbatim, plus the section 3 datasource/generator)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled
  directUrl = env("DIRECT_URL")     // direct, used by db push
}

generator client {
  provider = "prisma-client-js"
}

enum Role { VOLUNTEER ORGANIZATION SPONSOR }

enum ActivityDomain {
  ECOLOGY ENVIRONMENT EDUCATION HEALTH SOCIAL CULTURE
  SPORT HUMANITARIAN TECH ANIMAL_WELFARE
}

enum CampaignStatus { DRAFT PUBLISHED ONGOING COMPLETED CANCELLED }
enum EnrollmentStatus { ENROLLED WAITLISTED WITHDRAWN ATTENDED NO_SHOW }
enum SponsorTier { STARTER PRO MAX }
enum ContributionStatus { PENDING CONFIRMED FAILED }

enum NotificationType {
  CAMPAIGN_RECOMMENDATION CAMPAIGN_CANCELLED CAMPAIGN_REMINDER
  ENROLLMENT_CONFIRMED POINTS_AWARDED RANK_UP SPONSOR_CONFIRMED DONATION_RECEIVED
}

model User {
  id            String   @id @default(cuid())
  role          Role
  email         String   @unique
  displayName   String
  createdAt     DateTime @default(now())
  volunteer     VolunteerProfile?
  organization  OrganizationProfile?
  sponsor       SponsorProfile?
  notifications Notification[]
  savedCards    SavedCard[]
}

model VolunteerProfile {
  id               String           @id @default(cuid())
  userId           String           @unique
  user             User             @relation(fields: [userId], references: [id])
  fullName         String
  city             String?
  birthYear        Int?
  preferredDomains ActivityDomain[]
  bio              String?
  totalPoints      Int              @default(0)
  eventsCompleted  Int              @default(0)
  enrollments      Enrollment[]
  favorites        Favorite[]
  pointsLog        PointsTransaction[]
  checkIns         CheckIn[]
}

model OrganizationProfile {
  id           String           @id @default(cuid())
  userId       String           @unique
  user         User             @relation(fields: [userId], references: [id])
  name         String
  domains      ActivityDomain[]
  description  String?
  city         String?
  contactPhone String?
  verified     Boolean          @default(false)
  campaigns    Campaign[]
}

model SponsorProfile {
  id           String  @id @default(cuid())
  userId       String  @unique
  user         User    @relation(fields: [userId], references: [id])
  companyName  String
  sector       String?
  sponsorships Sponsorship[]
}

model Campaign {
  id               String         @id @default(cuid())
  orgId            String
  org              OrganizationProfile @relation(fields: [orgId], references: [id])
  title            String
  description      String
  domain           ActivityDomain
  city             String?
  location         String?
  startAt          DateTime
  endAt            DateTime
  capacity         Int            @default(0)
  pointsValue      Int            @default(100)
  status           CampaignStatus @default(PUBLISHED)
  coverImage       String?
  needsFunding     Boolean        @default(false)
  fundingGoal      Int?
  sponsorRequested Boolean        @default(false)
  createdAt        DateTime       @default(now())
  enrollments      Enrollment[]
  favorites        Favorite[]
  checkIns         CheckIn[]
  checkInTokens    CheckInToken[]
  sponsorships     Sponsorship[]
  donations        Donation[]
}

model Enrollment {
  id          String           @id @default(cuid())
  volunteerId String
  volunteer   VolunteerProfile @relation(fields: [volunteerId], references: [id])
  campaignId  String
  campaign    Campaign         @relation(fields: [campaignId], references: [id])
  status      EnrollmentStatus @default(ENROLLED)
  enrolledAt  DateTime         @default(now())
  @@unique([volunteerId, campaignId])
}

model Favorite {
  id          String           @id @default(cuid())
  volunteerId String
  volunteer   VolunteerProfile @relation(fields: [volunteerId], references: [id])
  campaignId  String
  campaign    Campaign         @relation(fields: [campaignId], references: [id])
  createdAt   DateTime         @default(now())
  @@unique([volunteerId, campaignId])
}

model CheckInToken {
  id          String    @id @default(cuid())
  token       String    @unique @default(cuid())
  volunteerId String
  campaignId  String
  campaign    Campaign  @relation(fields: [campaignId], references: [id])
  expiresAt   DateTime
  usedAt      DateTime?
  createdAt   DateTime  @default(now())
}

model CheckIn {
  id            String           @id @default(cuid())
  volunteerId   String
  volunteer     VolunteerProfile @relation(fields: [volunteerId], references: [id])
  campaignId    String
  campaign      Campaign         @relation(fields: [campaignId], references: [id])
  pointsAwarded Int
  checkedInAt   DateTime         @default(now())
  @@unique([volunteerId, campaignId])
}

model PointsTransaction {
  id          String           @id @default(cuid())
  volunteerId String
  volunteer   VolunteerProfile @relation(fields: [volunteerId], references: [id])
  amount      Int
  reason      String
  createdAt   DateTime         @default(now())
}

model SponsorshipPack {
  id          String      @id @default(cuid())
  tier        SponsorTier @unique
  priceDZD    Int
  benefitKeys String[]
}

model Sponsorship {
  id         String             @id @default(cuid())
  sponsorId  String
  sponsor    SponsorProfile     @relation(fields: [sponsorId], references: [id])
  campaignId String
  campaign   Campaign           @relation(fields: [campaignId], references: [id])
  tier       SponsorTier
  amountDZD  Int
  status     ContributionStatus @default(PENDING)
  createdAt  DateTime           @default(now())
}

model Donation {
  id         String             @id @default(cuid())
  campaignId String
  campaign   Campaign           @relation(fields: [campaignId], references: [id])
  donorName  String
  amountDZD  Int
  method     String             @default("EDAHABIA_MOCK")
  status     ContributionStatus @default(PENDING)
  createdAt  DateTime           @default(now())
}

model SavedCard {
  id         String @id @default(cuid())
  userId     String
  user       User   @relation(fields: [userId], references: [id])
  holderName String
  last4      String
  brand      String @default("EDAHABIA")
}

model Notification {
  id         String           @id @default(cuid())
  userId     String
  user       User             @relation(fields: [userId], references: [id])
  type       NotificationType
  titleKey   String
  bodyKey    String
  params     Json?
  read       Boolean          @default(false)
  campaignId String?
  createdAt  DateTime         @default(now())
}
```

(Formatting and comments may be normalised by `prisma format`; fields, types, defaults, relations and constraints are exactly the spec's.)

### 10.2 Relationship map

| From | Cardinality | To | Key | Notes |
|---|---|---|---|---|
| User | 1 - 0..1 | VolunteerProfile | `VolunteerProfile.userId @unique` | exactly one profile, matching `User.role` |
| User | 1 - 0..1 | OrganizationProfile | `OrganizationProfile.userId @unique` | |
| User | 1 - 0..1 | SponsorProfile | `SponsorProfile.userId @unique` | |
| User | 1 - n | Notification | `Notification.userId` | notifications target Users, so orgs and sponsors can receive them |
| User | 1 - n | SavedCard | `SavedCard.userId` | mock cards, sponsors in seed |
| OrganizationProfile | 1 - n | Campaign | `Campaign.orgId` | ownership for all org authorization |
| Campaign | 1 - n | Enrollment | `Enrollment.campaignId` | `@@unique([volunteerId, campaignId])` |
| VolunteerProfile | 1 - n | Enrollment | `Enrollment.volunteerId` | |
| Campaign / VolunteerProfile | 1 - n | Favorite | | `@@unique([volunteerId, campaignId])` |
| Campaign | 1 - n | CheckInToken | `CheckInToken.campaignId` | `volunteerId` is a plain string without FK (spec). Integrity enforced in code: only `issueToken` writes it, always with the authenticated volunteer's profile id |
| Campaign / VolunteerProfile | 1 - n | CheckIn | | `@@unique([volunteerId, campaignId])` = hard idempotency guard for attendance |
| VolunteerProfile | 1 - n | PointsTransaction | | ledger; `sum(amount) == totalPoints` invariant |
| SponsorProfile | 1 - n | Sponsorship | | |
| Campaign | 1 - n | Sponsorship | | caisse counts `CONFIRMED` only |
| Campaign | 1 - n | Donation | | caisse counts `CONFIRMED` only |
| SponsorshipPack | - | Sponsorship | by `tier` value (no FK) | price looked up by `tier @unique` |
| Notification | - | Campaign | `campaignId` plain string (no FK) | used for deep links only |

### 10.3 Invariants enforced by application code

1. `User.role` matches the single profile that exists for that user.
2. `VolunteerProfile.totalPoints == sum(PointsTransaction.amount)` for that volunteer; only `awardAttendance` (and the seed opening balance) writes points.
3. `VolunteerProfile.eventsCompleted` increments only in `awardAttendance`.
4. A `CheckIn` exists if and only if the matching `Enrollment.status == ATTENDED` (except walk-ins, disabled by default).
5. `SavedCard` never contains more than `last4` of a card number. No full number field exists in any Zod schema.
6. Notification rows contain i18n keys and params, never translated sentences.

---

## 11. Authentication architecture (demo-grade quick login)

`src/lib/session.ts` (server-only):

| Function | Behaviour |
|---|---|
| `login(userId: string): Promise<void>` | Verifies the user exists, then sets cookie `session = <userId>.<sig>` where `sig = base64url(HMAC_SHA256(SESSION_SECRET, userId))`. Cookie options: `httpOnly`, `sameSite: "lax"`, `secure` in production, `path: "/"`, `maxAge: 7 days`. Callable only from Server Actions / Route Handlers (Next.js only allows cookie writes there). |
| `getCurrentUser(): Promise<SessionUser \| null>` | Reads cookie, splits on the last `.`, recomputes HMAC, compares with `crypto.timingSafeEqual`. Returns `User` including `volunteer`, `organization`, `sponsor` relations, or `null` on any failure (missing cookie, bad signature, unknown user). Wrapped in React `cache()` so one request performs at most one lookup. |
| `logout(): Promise<void>` | Deletes the cookie. |
| `requireRole(role): Promise<RoleActor<role>>` | For pages. Calls `getCurrentUser()`. If no user or role mismatch or missing role profile: `redirect({ href: "/login", locale })`. Returns `{ user, profile }` where `profile` is the non-null `VolunteerProfile` / `OrganizationProfile` / `SponsorProfile` (typed by overloads). |
| `getActor(role): Promise<Result<RoleActor<role>>>` | For Server Actions and Route Handlers. Same checks, but returns `fail("UNAUTHENTICATED")` or `fail("FORBIDDEN")` instead of redirecting, so callers can return a predictable error / HTTP status. |

- `SESSION_SECRET` is read lazily at call time. If missing or shorter than 32 characters, the functions throw a clear configuration error at runtime; the build never reads it.
- No passwords, no email verification, no NextAuth.
- `/login` page lists seeded accounts grouped by role (demo accounts pinned first, by fixed email), each a form calling `loginAs(userId)`. It links to `/volunteer/onboarding` and `/org/onboarding`.
- Role homes: `VOLUNTEER -> /volunteer/feed`, `ORGANIZATION -> /org/dashboard`, `SPONSOR -> /sponsor/browse`.
- Signups (volunteer, organization) create real rows, call `login()` on the new user, and redirect to the role home. Sponsors have no signup (not in spec); they are seeded.

Explicit acknowledgment: anyone can log in as anyone. This is the spec's intended demo behaviour.

---

## 12. Authorization and role gating

| Area | Rule | Enforcement point |
|---|---|---|
| `/volunteer/*` (except `onboarding`) | role `VOLUNTEER` | `requireRole("VOLUNTEER")` first line of each page |
| `/volunteer/onboarding`, `/org/onboarding` | public; if already logged in, redirect to own role home | page |
| `/org/*` (except `onboarding`) | role `ORGANIZATION` | `requireRole("ORGANIZATION")` |
| `/org/campaigns/[id]/*` | campaign `orgId == actor.profile.id`, else `notFound()` | page |
| `/sponsor/*` | role `SPONSOR` | `requireRole("SPONSOR")` |
| `/`, `/login`, `/campaigns`, `/campaigns/[id]`, `/leaderboard` | public | - |
| Every Server Action | `getActor(role)` + ownership check before any write | action |
| `POST /api/checkin` | `ORGANIZATION` + owns token's campaign | route + `redeemToken` |
| `POST /api/pay` kind `SPONSORSHIP` | `SPONSOR` + card belongs to actor | route + `processSponsorship` |
| `POST /api/pay` kind `DONATION` | public | route |

Ownership is always re-checked on the server from IDs in the DB, never trusted from the client. Ownership failures on org resources return `NOT_FOUND` (does not reveal that another org's resource exists), except the scanner's `CAMPAIGN_NOT_OWNED`, which is more helpful at the event and leaks nothing personal.

The proxy (`src/proxy.ts`) does locale routing only. It does not gate roles, so gating logic lives in one place per page and cannot be bypassed by the matcher.

---

## 13. Session architecture

- Stateless signed cookie; no session table; nothing kept in memory between requests (serverless-safe).
- Cookie payload is only the `userId` (cuid). No role in the cookie: role is always read fresh from the DB, so role/profile changes take effect immediately.
- Layout: `[locale]/layout.tsx` calls `getCurrentUser()` to render the role navigation and the unread notification count. Therefore the layout and every page below it are dynamic.
- Locale is independent from the session: URL segment `/{locale}/...`; next-intl also sets its `NEXT_LOCALE` cookie on switch.
- Logout: form -> `logoutAction` -> `logout()` -> redirect `/{locale}`.

---

## 14. Validation architecture

- All schemas live in `src/lib/validation.ts`, exported with inferred types (`z.infer`). Client forms import the same schemas for react-hook-form so server and client agree.
- Server Actions receive plain objects (not `FormData`) from client components, except the simplest one-button forms (`loginAs`, `logoutAction`, `markAllRead`) which use bound arguments.
- Every action and route calls `schema.safeParse(input)`; failure returns `fail("VALIDATION", fieldErrors)` where `fieldErrors` is `z.flattenError(err).fieldErrors`. Zod objects strip unknown keys, so an extra field such as a card number is dropped, never stored.
- Error messages are i18n keys (`validation.required`, `validation.tooShort`, ...) set through Zod `error` options, rendered by the client with `t()`.

Schemas:

| Schema | Fields and rules |
|---|---|
| `idSchema` | `z.string().min(1).max(64)` (cuid) |
| `checkInTokenSchema` | `{ token: z.string().trim().min(8).max(128) }` |
| `volunteerSignupSchema` | `fullName` 2..80, `email` optional email (lowercased), `city` 2..60 optional, `birthYear` int 1930..(currentYear-12) optional, `preferredDomains` array of `ActivityDomain` 1..5 unique, `bio` max 500 optional |
| `orgSignupSchema` | `name` 2..100, `email` optional, `domains` 1..5 unique, `description` 10..1000 optional, `city` optional, `contactPhone` optional regex `^(\+213|0)[0-9 ]{8,12}$` |
| `campaignInputSchema` | `title` 3..120, `description` 10..4000, `domain` enum, `city` max 60 optional, `location` max 160 optional, `startAt`/`endAt` coerced dates with `endAt > startAt`, `capacity` int 0..10000, `pointsValue` int 0..1000, `status` in `DRAFT, PUBLISHED` on create and `DRAFT, PUBLISHED, ONGOING, COMPLETED` on update, `needsFunding` bool, `fundingGoal` int 1000..100000000 required when `needsFunding`, `sponsorRequested` bool |
| `addParticipantSchema` | `campaignId` id, `volunteerName` trim 2..80 |
| `enrollmentIdSchema` | `{ enrollmentId: id }` |
| `sponsorshipSchema` | `campaignId` id, `tier` enum `STARTER, PRO, MAX`, `cardId` id |
| `donationSchema` | `campaignId` id, `donorName` trim 2..80, `amountDZD` int 100..1000000 |
| `payRequestSchema` | discriminated union on `kind`: `SPONSORSHIP` + `sponsorshipSchema` fields, or `DONATION` + `donationSchema` fields |

Assumption (spec silent): signup email is optional in the form; when empty the server generates `<slug>-<6 random chars>@demo.tawa3.dz` to satisfy `User.email @unique`. Duplicate email returns `fail("EMAIL_TAKEN")`.

---

## 15. Server Actions

Common contract for every action below:

- Return type: `Promise<ActionResult<T>>` = `{ ok: true; data: T } | { ok: false; error: { code: ErrorCode; fieldErrors?: Record<string, string[]> } }`. Actions that end in navigation (`loginAs`, `logoutAction`, signups) call `redirect()` on success instead of returning data.
- Unexpected errors are caught once in a shared `runAction` wrapper, logged with `console.error`, and returned as `fail("INTERNAL")`. `redirect()`/`notFound()` control-flow errors are re-thrown.
- Revalidation groups are defined in section 36 and referenced by name.

### 15.1 `auth.ts`

**`loginAs(userId)`**
- Auth: none (public). Authz: none (demo).
- Input: `userId` (bound argument). Zod: `idSchema`.
- DB: `User.findUnique` (inside `login`).
- Transaction: no. Side effects: sets session cookie. Notifications: none. Revalidation: `all` (layout).
- Success: `redirect` to role home. Failure: `VALIDATION`, `NOT_FOUND`.
- Idempotency: yes (re-login overwrites cookie).

**`logoutAction()`**
- Auth: none. Input: none. DB: none. Side effect: cookie deleted. Revalidation: `all`. Success: redirect `/`. Idempotent.

### 15.2 `onboarding.ts`

**`signupVolunteer(input)`**
- Auth: public. Zod: `volunteerSignupSchema`.
- DB: `User.create({ role: VOLUNTEER, email, displayName: fullName, volunteer: { create: {...} } })` (nested create = one atomic statement).
- Transaction: implicit (single nested write). Side effects: `login(newUser.id)`.
- Notifications: none. Revalidation: `all`.
- Success: redirect `/volunteer/feed`. Failure: `VALIDATION`, `EMAIL_TAKEN` (Prisma `P2002` on email).
- Idempotency: not idempotent (each submit creates a user); the submit button is disabled while pending.

**`signupOrganization(input)`**
- Same as above with `orgSignupSchema`, `role: ORGANIZATION`, nested `organization.create` (`verified: false`). Redirect `/org/dashboard`, which renders the entered name and domains.

### 15.3 `enrollment.ts`

**`enroll(campaignId)`**
- Auth: `VOLUNTEER`. Zod: `idSchema`.
- Transaction: yes (interactive):
  1. `Campaign.findUnique`; not found -> `NOT_FOUND`; status not in `PUBLISHED, ONGOING` -> `CAMPAIGN_CLOSED`.
  2. `Enrollment.findUnique({ volunteerId_campaignId })`:
     - `ENROLLED` or `WAITLISTED` -> return current status (idempotent, no new notification).
     - `ATTENDED` -> `ALREADY_ATTENDED`.
     - `WITHDRAWN` or `NO_SHOW` -> will be re-activated below.
  3. `occupied = count(Enrollment where campaignId and status in (ENROLLED, ATTENDED))`.
  4. `status = capacity > 0 && occupied >= capacity ? WAITLISTED : ENROLLED`.
  5. `Enrollment.upsert` (create, or update status + `enrolledAt = now`).
  6. If `ENROLLED`: `notify(tx, user, ENROLLMENT_CONFIRMED, { campaignTitle })`.
- Points: none (spec: points only on attendance).
- Revalidation: `feeds`, `campaign(id)`, `volunteerProfile`, `inbox`, `orgCampaign(id)`.
- Success: `{ status: "ENROLLED" | "WAITLISTED", remaining: number | null }`.
- Failure: `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION`, `NOT_FOUND`, `CAMPAIGN_CLOSED`, `ALREADY_ATTENDED`.
- Idempotency: yes (unique constraint + early return).
- Client: `EnrollButton` uses `useOptimistic` and reconciles with the returned status.

**`withdraw(campaignId)`**
- Auth: `VOLUNTEER`. Zod: `idSchema`.
- DB: `Enrollment.findUnique`; missing -> `NOT_ENROLLED`; `ATTENDED` -> `ALREADY_ATTENDED`; `WITHDRAWN` -> ok (idempotent); else `update status = WITHDRAWN`. Single write, no transaction.
- Side effect: frees the seat (occupied count excludes `WITHDRAWN`). Waitlist promotion is P2 (section 39).
- Notifications: none. Revalidation: same as `enroll`.
- Success: `{ status: "WITHDRAWN" }`. Idempotent.

### 15.4 `favorites.ts`

**`toggleFavorite(campaignId)`**
- Auth: `VOLUNTEER`. Zod: `idSchema`.
- DB: `Favorite.findUnique`; exists -> `delete`; else `create` (catch `P2002` from a double click as "already favorited").
- Transaction: no (single write). Notifications: none. Revalidation: `feeds`, `volunteerProfile`.
- Success: `{ favorited: boolean }`. Failure: `NOT_FOUND` if campaign missing.
- Idempotency: toggle by nature; the client sends the desired state implicitly by current state, and `useOptimistic` reconciles with the returned value.

### 15.5 `checkin.ts`

**`issueCheckInToken(campaignId)`** -> calls `lib/checkin.issueToken` (section 21).
- Auth: `VOLUNTEER`. Zod: `idSchema`.
- Authz: volunteer must have an `Enrollment` for the campaign with status `ENROLLED` or `WAITLISTED`; `ATTENDED` -> `ALREADY_ATTENDED`; otherwise `NOT_ENROLLED`. Campaign status must be `PUBLISHED` or `ONGOING` -> else `CAMPAIGN_CLOSED`.
- DB: reuse an existing unused token for this `(volunteerId, campaignId)` with more than 10 minutes left; else `CheckInToken.create({ token: randomToken(), expiresAt: now + 120 min })`.
- Transaction: no (single write). Notifications: none. Revalidation: none (token is returned directly).
- Success: `{ token: string, expiresAt: string }`. Idempotent in effect (reuse window).

### 15.6 `notifications.ts`

**`markRead(id)`** - Auth: any logged-in role. Zod: `idSchema`. DB: `Notification.updateMany({ where: { id, userId: me }, data: { read: true } })` (ownership in the WHERE). Revalidation: `inbox`, `all` layout badge. Success `{ updated: 0 | 1 }`. Idempotent.

**`markAllRead()`** - Auth: any logged-in role. DB: `updateMany({ where: { userId: me, read: false } })`. Revalidation: `inbox`. Success `{ updated: number }`. Idempotent.

### 15.7 `campaigns.ts`

**`createCampaign(input)`**
- Auth: `ORGANIZATION`. Zod: `campaignInputSchema` (create variant).
- Transaction: yes:
  1. `Campaign.create({ ...input, orgId: actor.profile.id, fundingGoal: needsFunding ? fundingGoal : null })`.
  2. If `status == PUBLISHED`: find up to 100 volunteers whose `preferredDomains` has `domain` and `notifyMany(CAMPAIGN_RECOMMENDATION, { campaignTitle, orgName })` via `createMany`.
- Revalidation: `feeds`, `orgDashboard`, `orgCampaigns`, `sponsorBrowse`, `inbox`.
- Success: `{ id }`. Failure: `VALIDATION`, `FORBIDDEN`.
- Idempotency: not idempotent (form disables on submit).
- Assumption: recommendation notifications are the smallest way to make the spec's "recommendations" real for live-created campaigns; seeded recommendations exist too.

**`updateCampaign(id, input)`**
- Auth: `ORGANIZATION`. Authz: `campaign.orgId == actor.profile.id` else `NOT_FOUND`; status `CANCELLED` -> `CAMPAIGN_CLOSED`.
- Zod: `idSchema` + `campaignInputSchema` (update variant; allows `ONGOING` and `COMPLETED` so the org can mark an event as started or finished).
- DB: `Campaign.update`. Transaction: no. Notifications: none.
- Revalidation: `feeds`, `campaign(id)`, `orgDashboard`, `orgCampaigns`, `sponsorBrowse`.
- Success: `{ id }`. Idempotent (same input -> same state).
- Rule: lowering capacity below current occupancy is allowed and never removes anyone; it only closes new enrollments.

**`deleteCampaign(id)`** (soft delete = cancel; the UI labels it "Annuler la campagne")
- Auth: `ORGANIZATION`. Authz: owner else `NOT_FOUND`.
- Transaction: yes:
  1. If already `CANCELLED` -> return `{ notified: 0 }` (idempotent, no duplicate notices).
  2. `Campaign.update({ status: CANCELLED })`.
  3. Load enrollments with status `ENROLLED` or `WAITLISTED`, join `volunteer.userId`.
  4. `Notification.createMany(CAMPAIGN_CANCELLED, { campaignTitle, orgName }, campaignId)` for each.
- Enrollment rows keep their status (history preserved). Outstanding check-in tokens become unusable because `redeemToken` rejects cancelled campaigns.
- Revalidation: `feeds`, `campaign(id)`, `orgDashboard`, `orgCampaigns`, `inbox`, `volunteerProfile`, `sponsorBrowse`.
- Success: `{ notified: number }`.

### 15.8 `participants.ts`

**`addParticipantByName(campaignId, volunteerName)`**
- Auth: `ORGANIZATION`. Authz: owns campaign else `NOT_FOUND`; campaign not `CANCELLED` else `CAMPAIGN_CLOSED`.
- Zod: `addParticipantSchema`.
- Lookup: `VolunteerProfile.findMany({ where: { fullName: { equals: name, mode: "insensitive" } }, take: 5 })`. 0 -> `VOLUNTEER_NOT_FOUND`; more than 1 -> `AMBIGUOUS_NAME` with `candidates: [{ fullName, city }]`; exactly 1 -> continue.
- Transaction: yes: `Enrollment.upsert` to `ENROLLED` (existing `ENROLLED`/`WAITLISTED`/`WITHDRAWN`/`NO_SHOW` -> `ENROLLED`; `ATTENDED` -> `ALREADY_ATTENDED`), then `ENROLLMENT_CONFIRMED` notification to the volunteer.
- Assumption: an organization adding a person by hand overrides capacity (the organizer decides at the event).
- Revalidation: `orgCampaign(id)`, `orgDashboard`, `feeds`, `volunteerProfile`, `inbox`.
- Success: `{ enrollmentId, volunteerName }`. Idempotent (upsert).

**`removeParticipant(enrollmentId)`**
- Auth: `ORGANIZATION`. Authz: `enrollment.campaign.orgId == me` else `NOT_FOUND`. Zod: `enrollmentIdSchema`.
- DB: `ATTENDED` -> `ALREADY_ATTENDED` (points are never clawed back); else `update status = WITHDRAWN`.
- Transaction: no. Notifications: none. Revalidation: same as add.
- Success: `{ enrollmentId }`. Idempotent.

**`markAttendedManually(enrollmentId)`**
- Auth: `ORGANIZATION`. Authz: owner else `NOT_FOUND`. Zod: `enrollmentIdSchema`.
- Rules: enrollment status `WITHDRAWN` -> `NOT_ENROLLED`; campaign `CANCELLED` or `DRAFT` -> `CAMPAIGN_CLOSED`.
- DB: `awardAttendance(enrollment.volunteerId, campaign)` - the exact same function used by the QR scan (section 22). It opens its own transaction.
- Notifications: `POINTS_AWARDED`, maybe `RANK_UP` (inside `awardAttendance`).
- Revalidation: `attendance(campaignId)` group.
- Success: `AttendanceResult` (same shape as the check-in API). Idempotent (already attended -> `alreadyAttended: true`, 0 points).

### 15.9 `contributions.ts`

**`purchaseSponsorship({ campaignId, tier, cardId })`** -> `lib/contributions.processSponsorship` (section 25).
- Auth: `SPONSOR`. Zod: `sponsorshipSchema`.
- Success: `{ sponsorshipId, status: "CONFIRMED", amountDZD, transactionId }`.
- Failure: `VALIDATION`, `NOT_FOUND` (campaign/pack), `CARD_NOT_FOUND`, `CAMPAIGN_CLOSED`, `PAYMENT_FAILED`.

**`donate({ campaignId, donorName, amountDZD })`** -> `lib/contributions.processDonation`.
- Auth: public (current user used only to pick a saved card when present).
- Success: `{ donationId, status: "CONFIRMED", amountDZD, transactionId }`.

Both revalidate `caisse(campaignId)`.

---

## 16. Route Handlers

Both handlers: `export const dynamic = "force-dynamic"`, `export const runtime = "nodejs"`, POST only (other methods -> 405 via absence of export), JSON body parsed with `await req.json()` inside try/catch (invalid JSON -> 400 `VALIDATION`), `Content-Type: application/json` responses with `Cache-Control: no-store`.

| Route | Purpose | Reason it is a Route Handler |
|---|---|---|
| `POST /api/checkin` | Redeem a scanned or typed token | Spec requires it; called by `fetch` from the scanner phone and from the manual token field (same endpoint) |
| `POST /api/pay` | Mock payment for sponsorship or donation | Spec lists it; thin wrapper over the same `lib/contributions` functions the Server Actions use, so there is still one payment path |

No other Route Handler is created.

---

## 17. API contracts

### 17.1 `POST /api/checkin`

Request

```json
{ "token": "q3Zf...32 chars base64url" }
```

- Auth: session cookie, role `ORGANIZATION`.
- Zod: `checkInTokenSchema`.
- Processing: `redeemToken(orgProfileId, token)` (section 21), one interactive transaction.

Success `200`

```json
{
  "ok": true,
  "data": {
    "volunteerName": "Yanis Amrouche",
    "campaignTitle": "Nettoyage des berges de la Soummam à Akbou",
    "pointsAwarded": 150,
    "newTotal": 830,
    "alreadyAttended": false,
    "tierKey": "tier.committed",
    "rankUp": true,
    "wasWaitlisted": false
  }
}
```

(`alreadyAttended: true` with `pointsAwarded: 0` when the volunteer was already checked in, for example after a manual mark.)

Failures `{ "ok": false, "error": { "code": "..." } }`

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION` | body missing, not JSON, or token fails schema |
| 401 | `UNAUTHENTICATED` | no valid session |
| 403 | `FORBIDDEN` | logged in but not an organization |
| 404 | `TOKEN_NOT_FOUND` | no such token |
| 403 | `CAMPAIGN_NOT_OWNED` | token belongs to another organization's campaign |
| 409 | `TOKEN_USED` | `usedAt` set, or lost the race to claim it |
| 410 | `TOKEN_EXPIRED` | `expiresAt <= now` |
| 409 | `CAMPAIGN_CLOSED` | campaign `CANCELLED` or `DRAFT` |
| 409 | `NOT_ENROLLED` | no enrollment, or `WITHDRAWN` (walk-ins disabled) |
| 500 | `INTERNAL` | unexpected |

Check order: auth -> schema -> token exists -> ownership (checked before token state so another org learns nothing about it) -> used -> expired -> campaign status -> enrollment -> claim -> award.

The scanner maps `error.code` to `scanner.errors.<code>` messages.

### 17.2 `POST /api/pay`

Request (discriminated by `kind`):

```json
{ "kind": "SPONSORSHIP", "campaignId": "c...", "tier": "PRO", "cardId": "c..." }
{ "kind": "DONATION", "campaignId": "c...", "donorName": "Samir B.", "amountDZD": 5000 }
```

- Auth: `SPONSORSHIP` requires `SPONSOR`; `DONATION` public.
- Zod: `payRequestSchema`.
- Processing: `processSponsorship` / `processDonation` (section 25).

Success `200`

```json
{ "ok": true, "data": { "kind": "SPONSORSHIP", "reference": "c...", "status": "CONFIRMED", "amountDZD": 75000, "transactionId": "MOCK-<uuid>" } }
```

Failures: 400 `VALIDATION`, 401 `UNAUTHENTICATED`, 403 `FORBIDDEN`, 404 `NOT_FOUND` / `CARD_NOT_FOUND`, 409 `CAMPAIGN_CLOSED`, 402 `PAYMENT_FAILED`, 500 `INTERNAL`.

No field for a card number exists; any extra field is stripped by Zod.

### 17.3 `ActionResult` error codes (shared by actions and routes)

`UNAUTHENTICATED, FORBIDDEN, VALIDATION, NOT_FOUND, EMAIL_TAKEN, CAMPAIGN_CLOSED, ALREADY_ATTENDED, NOT_ENROLLED, VOLUNTEER_NOT_FOUND, AMBIGUOUS_NAME, TOKEN_NOT_FOUND, TOKEN_USED, TOKEN_EXPIRED, CAMPAIGN_NOT_OWNED, CARD_NOT_FOUND, PAYMENT_FAILED, INTERNAL`

Each has an i18n message at `errors.<CODE>` in all three message files.

---

## 18. Volunteer flows

| Feature | Page | Read (Server Component) | Mutations |
|---|---|---|---|
| Feed | `/volunteer/feed` | `getFeed(volunteerId)`: campaigns with status `PUBLISHED, ONGOING`, `orderBy createdAt desc`, include `org.name`, filtered `_count` of enrollments `ENROLLED`+`ATTENDED`, my enrollment status, my favorite flag. Card shows domain badge, city, dates, remaining seats (or "illimité"), funding flag | `enroll`, `withdraw`, `toggleFavorite` (optimistic) |
| Public feed | `/campaigns` | same query without personal flags; enroll button links to `/login` if anonymous | - |
| Detail | `/campaigns/[id]` | campaign + org + seats + funding progress + (if volunteer) my status | `enroll`, `withdraw`, `toggleFavorite`, `donate` |
| Profile | `/volunteer/profile` | `getVolunteerProfileStats`: profile, `getTierProgress(totalPoints)`, `getNationalRank(profile)`, last 10 `PointsTransaction`, attended campaigns (CheckIns + campaign), upcoming (enrollments `ENROLLED`/`WAITLISTED` with `endAt >= now`), favorites | - |
| Inbox | `/volunteer/inbox` | notifications for user, `orderBy [read asc, createdAt desc]`, `take 50`, unread count | `markRead`, `markAllRead` |
| Check-in QR | `/volunteer/checkin/[campaignId]` | server verifies enrollment (else shows "not enrolled" state with link to campaign; `ATTENDED` shows "already checked in" with points) | client `CheckInQr` calls `issueCheckInToken` on mount and on "Regenerer" |
| Leaderboard | `/leaderboard` | `getLeaderboard(20)` + my rank if volunteer | - |
| Signup | `/volunteer/onboarding` | domain list | `signupVolunteer` |

The profile has a link "Afficher mon QR" next to each upcoming/ongoing enrollment, which is the demo path to `/volunteer/checkin/[campaignId]`.

---

## 19. Organization flows

| Feature | Page | Read | Mutations |
|---|---|---|---|
| Onboarding | `/org/onboarding` | domain list | `signupOrganization` |
| Dashboard | `/org/dashboard` | org profile (name, domains); campaigns grouped by phase (below) with participant counts; totals: campaigns run (all non-draft), volunteers engaged (distinct volunteers with `ENROLLED` or `ATTENDED` in any org campaign), total raised (`caisse` sum) | links |
| Campaigns | `/org/campaigns` | org campaigns list + create form | `createCampaign`, `deleteCampaign` |
| Edit | `/org/campaigns/[id]/edit` | campaign (owner) | `updateCampaign` |
| Participants | `/org/campaigns/[id]/participants` | enrollments with volunteer name, city, status, check-in time; counts by status | `addParticipantByName`, `removeParticipant`, `markAttendedManually` |
| Scanner | `/org/scanner` | gate only | client -> `POST /api/checkin` |
| Caisse | `/org/caisse` | `getOrgCaisse(orgId)` (section 26) | - |
| Inbox | `/org/inbox` | same `InboxList` as volunteer | `markRead`, `markAllRead` |

Campaign phase for the dashboard (computed in `lib/campaigns.ts`, no cron, stored status untouched):

- `history`: status `COMPLETED` or `CANCELLED`, or `endAt < now`.
- `ongoing`: status `ONGOING`, or status `PUBLISHED` with `startAt <= now <= endAt`.
- `upcoming`: status `DRAFT` or `PUBLISHED` with `startAt > now`.

Organizations move a campaign to `ONGOING` / `COMPLETED` explicitly through `updateCampaign` if they want; the phase view does not depend on it.

---

## 20. Sponsor flows

| Feature | Page | Read | Mutations |
|---|---|---|---|
| Browse | `/sponsor/browse` | campaigns with (`sponsorRequested` or `needsFunding`) and status `PUBLISHED, ONGOING`, with org name, domain, city, `fundingGoal`, raised, percent (from `getFundingTotals`); the three `SponsorshipPack` rows with i18n benefits | - |
| Checkout | `/sponsor/checkout/[campaignId]` | campaign + funding, 3 packs, the sponsor's `SavedCard`s (holder name, brand, `**** last4`) | `purchaseSponsorship` |

Checkout UX: choose tier -> choose saved card -> "Confirmer le paiement" -> pending state (the mock takes 900 ms) -> confirmation panel with amount, pack and transaction id, link back to browse. The sponsor never types a card number.

Sponsors have no inbox page (no notification type targets sponsors).

---

## 21. QR architecture (centerpiece)

### 21.1 Token issue (volunteer phone)

`lib/checkin.issueToken(volunteerProfileId, campaignId)`:

1. Load enrollment and campaign; enforce rules of section 15.5.
2. Look for `CheckInToken` where `volunteerId`, `campaignId`, `usedAt = null`, `expiresAt > now + 10 min`; if found, return it (reloading the page does not spam tokens).
3. Else create with `token = crypto.randomBytes(24).toString("base64url")`, `expiresAt = now + TOKEN_TTL_MINUTES (120)`.
4. Return `{ token, expiresAt }`.

`CheckInQr` ("use client") renders `QRCode.toString(token, { type: "svg", errorCorrectionLevel: "M", margin: 2 })` at a large size, shows the expiry time, the token text in monospace (so it can be read aloud for manual entry), and a "Regenerer" button. The QR payload is the token string only: no name, no user id, no campaign id, no URL.

### 21.2 Scan (organization phone)

`/org/scanner`: server gate `requireRole("ORGANIZATION")`, then client `QrScanner`:

- On mount: dynamic import of `html5-qrcode`, `Html5Qrcode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 })`.
- On decode: pause the scanner, ignore the same token for 3 s (debounce), `fetch("/api/checkin", { method: "POST", body: JSON.stringify({ token }), credentials: "same-origin" })`.
- Result: `CheckInResultCard` shows volunteer name, campaign title, points awarded, new total, and "Palier atteint" when `rankUp`; errors show the translated `scanner.errors.<code>`. Button "Scanner le suivant" resumes.
- Camera failure (permission denied, no camera, insecure context): the component shows the error state; the page is still fully usable because of the fallbacks below.

Mandatory fallbacks on the same page (spec 7.2.E and 10):

1. `ManualTokenForm`: text input + submit -> the **same** `POST /api/checkin`.
2. A note with a link to the organization's campaigns explaining that attendance can be marked from the participant list (`markAttendedManually` -> same `awardAttendance`).
3. The seeded demo token (section 29) can be typed into the manual form.

### 21.3 Redeem (server)

`lib/checkin.redeemToken(orgProfileId, rawToken)` runs one `prisma.$transaction(async (tx) => ...)`:

1. `tx.checkInToken.findUnique({ where: { token }, include: { campaign: true } })` -> `TOKEN_NOT_FOUND`.
2. `campaign.orgId !== orgProfileId` -> `CAMPAIGN_NOT_OWNED`.
3. `usedAt !== null` -> `TOKEN_USED`.
4. `expiresAt <= now` -> `TOKEN_EXPIRED`.
5. `campaign.status in (CANCELLED, DRAFT)` -> `CAMPAIGN_CLOSED`.
6. Enrollment for `(token.volunteerId, campaignId)`: missing or `WITHDRAWN` -> `NOT_ENROLLED` (if `ALLOW_WALK_IN` were true, a missing enrollment would be created as `ENROLLED` first; the constant is `false`, the spec default).
7. Claim atomically: `tx.checkInToken.updateMany({ where: { id, usedAt: null }, data: { usedAt: now } })`; `count !== 1` -> `TOKEN_USED` (concurrent double scan).
8. `awardAttendance(token.volunteerId, campaign, tx)` -> `AttendanceResult`.

Rule failures are thrown as `DomainError(code)` inside the transaction so nothing is written, then mapped to the HTTP status table. After commit the route handler runs the `attendance(campaignId)` revalidation group.

Which enrollment statuses may check in is defined once, in section 21.5.

### 21.4 Security properties

Opaque 192-bit random token, single-use (atomic claim), 2 h TTL, server-side org ownership check, no PII in the QR, nothing decoded from the QR is trusted beyond the lookup key, endpoint requires an organization session.

### 21.5 Check-in eligibility by enrollment status (decision)

**WAITLISTED volunteers ARE eligible for check-in.** This applies identically to all three attendance paths, because they share one eligibility function (`assertCheckInEligible(status)` in `lib/checkin.ts`) and one engine (`awardAttendance`).

| Enrollment status | Can get a QR (`issueCheckInToken`) | QR scan / manual token (`/api/checkin`) | Manual mark (`markAttendedManually`) |
|---|---|---|---|
| `ENROLLED` | yes | yes -> `ATTENDED`, points awarded | yes -> `ATTENDED`, points awarded |
| `WAITLISTED` | **yes** (page shows a notice: "Vous êtes sur liste d'attente : l'organisateur confirme votre participation sur place.") | **yes** -> `ATTENDED`, points awarded | **yes** -> `ATTENDED`, points awarded |
| `NO_SHOW` (P2 status) | yes | yes (late correction) | yes |
| `ATTENDED` | no, page shows "déjà pointé" with the points received | idempotent: `200`, `alreadyAttended: true`, 0 points | idempotent: same result |
| `WITHDRAWN` | no -> `NOT_ENROLLED` | no -> `409 NOT_ENROLLED` | no -> `NOT_ENROLLED` |
| no enrollment | no -> `NOT_ENROLLED` | no -> `409 NOT_ENROLLED` (walk-ins off, `ALLOW_WALK_IN = false`) | not reachable (needs an enrollment id) |

Rationale:

- The spec's rule is "the volunteer has an Enrollment for that campaign". A waitlisted volunteer has one; `WITHDRAWN` is the only status that means the volunteer cancelled.
- The waitlist is a planning signal, not an access control. At the event the organizer is the one holding the scanner, so the organizer decides whether to admit a waitlisted person by scanning or not scanning. Rejecting someone standing in front of the organizer would be a dead end, which the spec explicitly forbids for the demo.
- Consequence, accepted: checking in a waitlisted volunteer can push occupied seats (`ENROLLED` + `ATTENDED`) above `capacity`. Capacity only limits new online enrollments; it never blocks physical attendance.
- The scanner result card shows a "liste d'attente" label when the enrollment was `WAITLISTED` before check-in (`AttendanceResult.wasWaitlisted: true`), so the organizer sees it.

---

## 22. Attendance engine (single source of truth)

`src/lib/points.ts`:

```ts
export async function awardAttendance(
  volunteerId: string,
  campaign: Pick<Campaign, "id" | "title" | "pointsValue">,
  db?: Prisma.TransactionClient,
): Promise<AttendanceResult>
```

- If `db` is provided (QR path), it runs inside the caller's transaction. If not (manual path), it opens `prisma.$transaction(tx => run(tx))` itself. The body `run(tx)` is one private function, so **both paths execute identical code**.
- Callers: `redeemToken` (QR scan and manual token entry) and `markAttendedManually`. No other code writes `CheckIn`, `PointsTransaction`, `totalPoints` or `eventsCompleted`.

Body, all on `tx`:

1. `existing = tx.checkIn.findUnique({ volunteerId_campaignId })`. If present: make sure the enrollment is `ATTENDED`, then return `{ alreadyAttended: true, pointsAwarded: 0, newTotal: profile.totalPoints, volunteerName, tierKey, rankUp: false }`. No writes, no notifications.
2. `before = tx.volunteerProfile.findUniqueOrThrow({ id: volunteerId, select: totalPoints, fullName, userId })`.
3. `tx.checkIn.create({ volunteerId, campaignId, pointsAwarded: campaign.pointsValue })`. A concurrent duplicate hits `@@unique` (`P2002`), which aborts the transaction; the caller catches `P2002` and re-reads, returning the `alreadyAttended` result.
4. `tx.pointsTransaction.create({ volunteerId, amount: pointsValue, reason: "ATTENDED:" + campaign.id })`.
5. `after = tx.volunteerProfile.update({ totalPoints: { increment: pointsValue }, eventsCompleted: { increment: 1 } })`.
6. `tx.enrollment.upsert` to status `ATTENDED` (update path in practice; create path only reachable with walk-ins).
7. `notify(tx, before.userId, POINTS_AWARDED, { campaignTitle, points: pointsValue, total: after.totalPoints })`.
8. `oldTier = getTier(before.totalPoints)`, `newTier = getTier(after.totalPoints)`; if `newTier.min > oldTier.min`: `notify(tx, userId, RANK_UP, { tierKey: newTier.key })`.
9. Return `{ alreadyAttended: false, volunteerName, pointsAwarded, newTotal: after.totalPoints, tierKey: newTier.key, rankUp }`.

A campaign with `pointsValue = 0` still records the check-in, the ledger row (amount 0) and `eventsCompleted + 1`.

---

## 23. Gamification

`src/lib/tiers.ts` (pure, used on server and client):

| Key | Min points |
|---|---|
| `tier.newcomer` | 0 |
| `tier.contributor` | 300 |
| `tier.committed` | 800 |
| `tier.champion` | 1800 |
| `tier.legend` | 4000 |

- `getTier(points)` returns the highest tier with `min <= points`.
- `getTierProgress(points)` returns `{ current, next | null, pointsToNext, percent }` (percent 100 at legend).

`src/lib/points.ts`:

- `getNationalRank(profile)`: `1 + count(VolunteerProfile where totalPoints > p OR (totalPoints = p AND eventsCompleted > e) OR (totalPoints = p AND eventsCompleted = e AND id < myId))`. This is the 1-based position in the order `totalPoints desc, eventsCompleted desc, id asc`. The `id` tie-breaker only makes the position deterministic; it does not change the spec's ordering.
- `getLeaderboard(limit = 20)`: `findMany orderBy [totalPoints desc, eventsCompleted desc, id asc] take limit`, rank = index + 1. Same ordering as `getNationalRank`, so both views always agree.
- Points are awarded only by `awardAttendance`. Enrollment awards nothing.
- Rewards catalog (P2): static array in `lib/rewards.ts` (`{ key, pointsCost }`), display-only on the profile.

---

## 24. Notifications

`src/lib/notifications.ts` (server-only):

```ts
notify(db, userId, type, params?, campaignId?)          // one row
notifyMany(db, userIds[], type, params?, campaignId?)   // createMany
```

`titleKey` and `bodyKey` are derived from a fixed map, so callers cannot store free text:

| Type | titleKey / bodyKey | params | Created by |
|---|---|---|---|
| `CAMPAIGN_RECOMMENDATION` | `notifications.recommendation.title/body` | `campaignTitle`, `orgName` | `createCampaign` (matching `preferredDomains`), seed |
| `CAMPAIGN_CANCELLED` | `notifications.cancelled.title/body` | `campaignTitle`, `orgName` | `deleteCampaign` |
| `CAMPAIGN_REMINDER` | `notifications.reminder.title/body` | `campaignTitle`, `startAt` | seed only (no scheduler, see assumptions) |
| `ENROLLMENT_CONFIRMED` | `notifications.enrollmentConfirmed.title/body` | `campaignTitle` | `enroll` (status ENROLLED), `addParticipantByName` |
| `POINTS_AWARDED` | `notifications.pointsAwarded.title/body` | `campaignTitle`, `points`, `total` | `awardAttendance` |
| `RANK_UP` | `notifications.rankUp.title/body` | `tierKey` | `awardAttendance` |
| `SPONSOR_CONFIRMED` | `notifications.sponsorConfirmed.title/body` | `campaignTitle`, `companyName`, `tierKey`, `amount` | `processSponsorship` (to org user) |
| `DONATION_RECEIVED` | `notifications.donationReceived.title/body` | `campaignTitle`, `donorName`, `amount` | `processDonation` (to org user) |

Rendering (`NotificationItem`, server component):

- `t(titleKey, resolvedParams)` / `t(bodyKey, resolvedParams)` with `getTranslations()` of the active locale.
- Param convention: any param whose name ends in `Key` holds an i18n key and is translated first (`tierKey: "tier.committed"` -> "Engage"). `amount` is formatted with `format.number(amount, { style: "currency", currency: "DZD" })`; `startAt` with `format.dateTime`.
- User-generated text (campaign titles, org names, donor names) is stored as entered and shown as is in every locale; only the surrounding sentence is translated.
- Unread badge: `count(read = false)` in the layout, shown as a number, no emoji.
- The inbox links to `/campaigns/[campaignId]` when `campaignId` is set.

---

## 25. Payments

`src/lib/payments.ts` is the spec code verbatim (`ChargeInput`, `ChargeResult`, `PaymentProvider`, `MockEdahabiaProvider` with a 900 ms delay, exported `payments`), plus `import "server-only"`. The commented `SatimProvider` placeholder stays a comment. No real gateway.

`src/lib/contributions.ts`:

**`processSponsorship(sponsorProfile, userId, { campaignId, tier, cardId })`**

1. Read: campaign (`NOT_FOUND`; status must be `PUBLISHED` or `ONGOING`, else `CAMPAIGN_CLOSED`), pack by `tier` (`NOT_FOUND`), card by `{ id: cardId, userId }` (`CARD_NOT_FOUND`).
2. `amountDZD = pack.priceDZD` (never from the client).
3. Write 1: `Sponsorship.create({ status: PENDING })` (visible trail if the process dies mid-way).
4. `payments.charge({ amountDZD, reference: sponsorship.id, card: { last4, holderName } })` - outside any transaction, so no DB connection is held during the 900 ms delay.
5. `FAILED` -> `Sponsorship.update({ status: FAILED })`, return `PAYMENT_FAILED`.
6. `CONFIRMED` -> transaction: `Sponsorship.update({ status: CONFIRMED })` + `notify(org user, SPONSOR_CONFIRMED, { campaignTitle, companyName, tierKey: "packs.<tier>.name", amount })`.
7. Revalidate `caisse(campaignId)`.

**`processDonation(currentUser | null, { campaignId, donorName, amountDZD })`**

Same pattern: `Donation.create({ status: PENDING, method: "EDAHABIA_MOCK" })` -> charge -> transaction `{ update CONFIRMED + notify org DONATION_RECEIVED }` or `FAILED`.

Card used for a donation: the logged-in user's first `SavedCard` if any, otherwise a mock card `{ last4: "0000", holderName: donorName }`. Assumption: the spec's donation form is "amount + donor name" only, and the mock provider ignores the card, so no card input is shown to anonymous donors.

"Crediting the caisse" means the row becomes `CONFIRMED`. There is no stored balance column in the spec schema, so the caisse is always computed from confirmed rows (section 26), which makes it impossible for the balance and the contribution list to disagree.

Card storage: only `holderName`, `last4`, `brand`. No schema, form or API accepts a full card number.

---

## 26. Caisse

`src/lib/caisse.ts`:

- `getFundingTotals(campaignIds[])`: two `groupBy` queries (`Donation` and `Sponsorship`, `status = CONFIRMED`, `_sum amountDZD`) merged into `Map<campaignId, { raised, donations, sponsorships }>`. Used by the caisse, org dashboard, sponsor browse, campaign detail and cards. Single source for "raised".
- `getOrgCaisse(orgId)`: org campaigns where `needsFunding` or having at least one confirmed contribution. For each: `fundingGoal`, `raised`, `percent = fundingGoal ? round(raised / fundingGoal * 100) : null` (real value may exceed 100; progress bar clamps display to 100), and the merged contribution list sorted by date desc: `{ type: "DONATION" | "SPONSORSHIP", contributorName (donorName or sponsor.companyName), amountDZD, tier?, createdAt }`. Also the org grand total.
- Only `CONFIRMED` rows count. `PENDING`/`FAILED` never appear in totals.

---

## 27. i18n

- `src/i18n/routing.ts`: `defineRouting({ locales: ["fr", "en", "ar"], defaultLocale: "fr", localePrefix: "always" })`. URLs are always `/fr/...`, `/en/...`, `/ar/...`; `/` redirects to `/fr` (or the `NEXT_LOCALE` cookie / `Accept-Language` match).
- `src/proxy.ts`: `export default createMiddleware(routing)`, matcher `"/((?!api|_next|_vercel|.*\\..*).*)"` (API routes and static files are not localized).
- `src/i18n/request.ts`: `getRequestConfig` validates the locale with `hasLocale`, loads `messages/{locale}.json` and deep-merges it over `messages/fr.json`, so a key missing in `en`/`ar` falls back to French instead of crashing. `timeZone: "Africa/Algiers"`, shared `formats` (DZD currency, `numberingSystem: "latn"` so Arabic UI shows Western digits, as is usual in Algeria).
- `src/i18n/navigation.ts`: `createNavigation(routing)`; all internal links and redirects use these locale-aware helpers.
- `next.config.ts`: `createNextIntlPlugin("./src/i18n/request.ts")`.
- `[locale]/layout.tsx`: `<html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>`, `NextIntlClientProvider` with messages.
- `LanguageSwitcher` ("use client"): `router.replace(pathname, { locale })` keeps the current page.
- Server code uses `getTranslations` / `getFormatter`; client uses `useTranslations` / `useFormatter`.
- Stored content: the DB stores keys for everything system-generated (notifications, pack benefits `benefitKeys`, tiers, domains via `domains.<DOMAIN>`, statuses via `status.<STATUS>`). User content (campaign titles/descriptions, names) is stored once, in French for the seed.

Top-level namespaces (identical in all three files): `app, nav, common, landing, auth, onboarding, campaigns, domains, status, enrollment, profile, tier, leaderboard, inbox, notifications, checkin, scanner, org, participants, caisse, sponsor, packs, donation, errors, validation`.

P0: `fr.json` complete for every key used; `en.json` and `ar.json` contain at least `app`, `nav`, `common`, `domains`, `status`, `tier`, `errors` (fallback covers the rest). P2: complete EN/AR.

---

## 28. RTL

- Direction comes only from `<html dir>`. No per-component direction logic.
- Tailwind logical utilities only: `ps-* pe-* ms-* me-* start-* end-* text-start text-end border-s border-e rounded-s rounded-e`. Forbidden: `pl- pr- ml- mr- left- right- text-left text-right border-l border-r rounded-l rounded-r`.
- Enforcement: `npm run check:rtl` greps `src/` for the forbidden class patterns and exits non-zero on a hit. Run before every commit that touches UI; shadcn components are audited and converted after each `shadcn add`.
- Directional icons (chevrons, arrows) get `rtl:rotate-180`.
- Framer Motion horizontal offsets use a sign derived from `useLocale() === "ar" ? -1 : 1`.
- Arabic font: `next/font/google` (Noto Sans Arabic) applied when `locale === "ar"`; Latin font otherwise. Fonts are downloaded at build time and self-hosted, no runtime dependency.
- Numbers, dates and currency through next-intl formatters (never string concatenation), so they are ordered correctly inside RTL text. The QR token text is wrapped in `dir="ltr"`.

---

## 29. Seed strategy

`prisma/seed.ts` (run with `npx prisma db seed`, registered as `"prisma": { "seed": "tsx prisma/seed.ts" }`):

1. Wipe in leaf-first order: `Notification, PointsTransaction, CheckIn, CheckInToken, Favorite, Enrollment, Donation, Sponsorship, SavedCard, Campaign, SponsorshipPack, VolunteerProfile, OrganizationProfile, SponsorProfile, User`. Re-running always yields the same dataset (idempotent). Warning: it deletes live demo data.
2. Insert packs, organizations, sponsors, volunteers, campaigns, enrollments, favorites, past check-ins with ledger, contributions, notifications, demo token.
3. Dates are relative to the seed run (`now`), so ongoing/upcoming/history stay correct if the seed is re-run on the demo morning. Exception: the Ramadan campaign uses a fixed date in Ramadan 2027 (`2027-02-20`).
4. Ledger consistency: for each volunteer, one `PointsTransaction` with reason `OPENING_BALANCE` equal to `totalPoints - sum(seeded check-in points)`, so `sum(ledger) == totalPoints`. `eventsCompleted` likewise covers older unseeded history.
5. No emoji. All visible text in French.
6. The seed uses the normal Prisma client (`DATABASE_URL`, pooled); only `db push` uses `DIRECT_URL`. Batches of `createMany` keep it fast.

### 29.1 Sponsorship packs

| Tier | Price (DZD) | benefitKeys |
|---|---|---|
| STARTER | 25 000 | `packs.benefits.thanksPost`, `packs.benefits.logoOnCampaignPage` |
| PRO | 75 000 | STARTER + `packs.benefits.logoOnVolunteerShirts`, `packs.benefits.impactReport` |
| MAX | 200 000 | PRO + `packs.benefits.namedPartner`, `packs.benefits.employeeVolunteeringDay` |

### 29.2 Organizations (6)

| Key | Name | City | Domains | Verified | Login email |
|---|---|---|---|---|---|
| ORG_A | Association Soummam Verte | Akbou | ECOLOGY, ENVIRONMENT | yes | `org.demo@tawa3.dz` (demo org) |
| ORG_B | Association Nour Santé | Sétif | HEALTH, HUMANITARIAN | yes | `nour.sante@tawa3.dz` |
| ORG_C | Association El Khir Solidarité | Béjaïa | SOCIAL, HUMANITARIAN | yes | `elkhir@tawa3.dz` |
| ORG_D | Association Savoir Pour Tous | Tizi Ouzou | EDUCATION, CULTURE | yes | `savoir@tawa3.dz` |
| ORG_E | Collectif Code Solidaire | Alger | TECH, EDUCATION | no | `code.solidaire@tawa3.dz` |
| ORG_F | Association Sport Sans Limites | Oran | SPORT, SOCIAL, CULTURE | yes | `sport.sans.limites@tawa3.dz` |

All names are fictional; no real organization is impersonated.

### 29.3 Campaigns (22)

`D` = seed day. Status is stored; "ongoing" campaigns are stored as `ONGOING`.

| # | Org | Title (FR) | Domain | City | Status / dates | Cap | Pts | Funding |
|---|---|---|---|---|---|---|---|---|
| C01 | A | Nettoyage des berges de la Soummam à Akbou | ECOLOGY | Akbou | ONGOING, now-2h -> now+48h | 30 | 150 | - |
| C02 | A | Nettoyage de la plage de Tichy | ECOLOGY | Tichy (Béjaïa) | PUBLISHED, D+12 | 40 | 150 | goal 120 000, sponsorRequested |
| C03 | A | Journée de nettoyage du quartier et tri des déchets recyclables | ECOLOGY | Akbou | COMPLETED, D-20 | 25 | 120 | - |
| C04 | A | Plantation d'arbres dans la forêt de Yakouren | ENVIRONMENT | Yakouren (Tizi Ouzou) | PUBLISHED, D+25 | 50 | 200 | goal 150 000 |
| C05 | A | Nettoyage de la forêt de Chréa | ENVIRONMENT | Blida | COMPLETED, D-40 | 30 | 150 | - |
| C06 | B | Journée de don de sang | HEALTH | Sétif | PUBLISHED, D+8 | 60 | 150 | - |
| C07 | B | Formation aux premiers secours | HEALTH | Sétif | PUBLISHED, D+15 | 4 (full) | 200 | - |
| C08 | B | Visite solidaire aux patients du service d'oncologie | HEALTH | Constantine | PUBLISHED, D+10 | 12 | 150 | - |
| C09 | B | Course solidaire contre le cancer | HEALTH | Sétif | PUBLISHED, D+30 | 0 (unlimited) | 100 | goal 300 000, sponsorRequested |
| C10 | C | Distribution de paniers alimentaires | HUMANITARIAN | Akbou | COMPLETED, D-35 | 30 | 120 | goal 200 000 |
| C11 | C | Maraude hivernale et distribution de couvertures | HUMANITARIAN | Béjaïa | PUBLISHED, D+75 | 25 | 150 | goal 180 000, sponsorRequested |
| C12 | C | Action solidaire du Ramadan : préparation et distribution de couffins | HUMANITARIAN | Akbou | PUBLISHED, 2027-02-20 | 50 | 200 | goal 400 000, sponsorRequested |
| C13 | C | Rénovation et peinture de l'école primaire de Seddouk | SOCIAL | Seddouk | PUBLISHED, D+20 | 15 | 250 | goal 250 000, sponsorRequested |
| C14 | C | Nettoyage et entretien de la mosquée du quartier | SOCIAL | Akbou | CANCELLED (was D+3) | 20 | 100 | - |
| C15 | D | Révisions gratuites du BAC | EDUCATION | Tizi Ouzou | PUBLISHED, D+7 | 25 | 150 | - |
| C16 | D | Soutien scolaire pour collégiens : préparation du BEM | EDUCATION | Tizi Ouzou | ONGOING, D-3 -> D+30 | 15 | 120 | - |
| C17 | D | Atelier d'alphabétisation pour adultes | EDUCATION | Bouira | COMPLETED, D-15 | 12 | 150 | - |
| C18 | E | Atelier d'initiation à la programmation | TECH | Alger | PUBLISHED, D+9 | 20 | 150 | - |
| C19 | E | Initiation des seniors à Internet et aux outils numériques | EDUCATION | Alger | PUBLISHED, D+14 | 10 | 120 | - |
| C20 | E | Création du site web et traduction des contenus d'une association | TECH | Alger | DRAFT, D+21 | 5 | 250 | - |
| C21 | F | Tournoi de basket fauteuil | SPORT | Oran | PUBLISHED, D+18 | 20 | 150 | goal 160 000, sponsorRequested |
| C22 | F | Enregistrement de livres audio et accompagnement de personnes malvoyantes | CULTURE | Oran | PUBLISHED, D+6 | 10 | 150 | - |
| C23 | F | Journée sportive inclusive | SPORT | Oran | COMPLETED, D-25 | 30 | 120 | - |

Total: 23 campaigns (spec asks for about 15-20; the extra ones exist so every mockup example campaign is represented and every org dashboard has upcoming and history items). Descriptions are 2-4 natural French sentences each (what, where, meeting point, what to bring, who benefits). `coverImage` is `null` (color block placeholder by domain) unless the frontend adds files under `/public/campaigns/`.

### 29.4 Volunteers (12)

| Name | City | Points | Events | Tier | Notes |
|---|---|---|---|---|---|
| Lina Meziane | Alger | 4250 | 31 | legend | |
| Karim Boudiaf | Sétif | 2180 | 17 | champion | |
| Sarah Amrani | Tizi Ouzou | 1920 | 15 | champion | |
| Rayan Cherif | Oran | 1240 | 10 | committed | |
| Nesrine Belaid | Béjaïa | 960 | 8 | committed | |
| Walid Hamidi | Constantine | 810 | 7 | committed | |
| **Yanis Amrouche** | Akbou | 680 | 6 | contributor | **demo volunteer**, `benevole.demo@tawa3.dz` |
| Imane Kaci | Akbou | 540 | 5 | contributor | |
| Sofiane Ait Ahmed | Bouira | 390 | 4 | contributor | |
| Meriem Benali | Alger | 260 | 3 | newcomer | |
| Amine Ouali | Béjaïa | 120 | 1 | newcomer | |
| Chaima Rahmani | Oran | 0 | 0 | newcomer | new member |

No two volunteers share `(totalPoints, eventsCompleted)`.

Demo story (intended): the demo volunteer has 680 points. Checking in to C01 (+150) gives 830 points, crossing 800: tier becomes `committed` and a `RANK_UP` notification appears.

The rank before and after is **not assumed**. It is computed against the real seeded database by `npm run seed:verify` (`prisma/verify-seed.ts`), which uses the same `getNationalRank` ordering as the app, simulates the +150 without writing, and fails if the demo volunteer does not cross a tier. Verified result: see section 29.7.

### 29.5 Sponsors (4), all fictional

| Company | Sector | Saved card (holder, last4) |
|---|---|---|
| Soummam Agro SARL | Agroalimentaire | Karim Messaoudi, 4821 |
| Kabylie Numérique SPA | Numérique | Nadia Hamdi, 7310 |
| Atlas Bâtiment | BTP | Mourad Ziani, 2294 |
| Pharma Hodna | Pharmaceutique | Samia Bouzid, 5567 |

Demo sponsor login: `sponsor.demo@tawa3.dz` (Soummam Agro SARL).

### 29.6 Relations

- Enrollments: C01 has the demo volunteer + 5 others `ENROLLED`; C07 has 4 `ENROLLED` (full; the next enrollment is `WAITLISTED`); C14 (cancelled) had the demo volunteer and 3 others `ENROLLED`; upcoming campaigns have 2-8 enrollments each; C16 has 6 `ENROLLED`.
- Past attendance: completed campaigns C03, C05, C10, C17, C23 have 3-8 volunteers each with `CheckIn` + `ATTENDED` + `PointsTransaction("ATTENDED:<id>")`; the demo volunteer attended C03 and C10; a couple of `NO_SHOW` rows on C05 for realism.
- Favorites: demo volunteer favorites C04 and C13; others spread randomly but deterministically.
- Donations (`CONFIRMED`, `EDAHABIA_MOCK`): C10 (4 donations, total 46 000), C02 (2, total 8 500), C09 (5, total 31 000), C12 (3, total 22 000).
- Sponsorships (`CONFIRMED`): Soummam Agro PRO on C12 (75 000), Atlas Bâtiment MAX on C13 (200 000), Pharma Hodna PRO on C09 (75 000), Kabylie Numérique STARTER on C02 (25 000).
- Notifications:
  - demo volunteer: 2 `CAMPAIGN_RECOMMENDATION` (C04, C13, unread), 1 `CAMPAIGN_REMINDER` (C01, unread), 1 `ENROLLMENT_CONFIRMED` (C01, read), 1 `CAMPAIGN_CANCELLED` (C14, unread), 1 `POINTS_AWARDED` (C10, read).
  - demo org: 1 `DONATION_RECEIVED` (C02), 1 `SPONSOR_CONFIRMED` (C02).
  - org C: `SPONSOR_CONFIRMED` for C12 and C13.
- Demo check-in token: `CheckInToken { token: "TAWA3-DEMO-7K2Q9XHM", volunteerId: demo volunteer, campaignId: C01, expiresAt: now + 30 days }`. It is opaque (no PII) and deliberately long-lived as the documented fallback for the stage; normal tokens keep the 2 h TTL. It is single-use like any token; re-running the seed restores it.

---

### 29.7 Verified demo numbers

Computed by `npm run seed:verify` against the actually seeded database (local PostgreSQL 17, 2026-09-19), using the app's own `src/lib/ranking.ts` and `src/lib/tiers.ts`:

```
Demo volunteer: Yanis Amrouche
Demo campaign: Nettoyage des berges de la Soummam à Akbou (+150 points)
Before check-in: 680 points, 6 events, tier.contributor, national rank 7 of 12
After check-in:  830 points, 7 events, tier.committed, national rank 6 of 12
seed:verify passed
```

The script also checks: ledger sum equals `totalPoints` for all 12 volunteers; no two volunteers share `(totalPoints, eventsCompleted)`; the demo token exists, is unused, unexpired and belongs to the demo volunteer; the demo campaign is `ONGOING`, owned by the demo organization, with the demo volunteer `ENROLLED`; the waitlist campaign is full. It must be re-run after seeding Neon (pre-demo QA), because ranks depend on the data actually present.

## 30. Mockup Content Mapping

Principle: the mockups describe **activities**, which are campaign content (title, description, domain, city). None of them introduces a backend feature beyond what `BACKEND_SPEC.md` already defines (campaign CRUD, enrollment, check-in, points, funding). No model is added for any activity.

### 30.1 Domain assignment rules (enum unchanged)

| ActivityDomain | Used for |
|---|---|
| `ECOLOGY` | cleanups (plages, quartiers, berges), collecte et tri, recyclage |
| `ENVIRONMENT` | plantation d'arbres, forêts, préservation des espaces naturels |
| `HEALTH` | don de sang, premiers secours, visites aux malades, soutien moral, courses solidaires santé |
| `HUMANITARIAN` | aide matérielle directe aux personnes démunies: distributions alimentaires, Ramadan, couvertures, maraudes |
| `SOCIAL` | entraide communautaire: rénovation, peinture d'écoles, entretien de lieux communautaires (mosquées), accompagnement de personnes à mobilité réduite |
| `EDUCATION` | soutien scolaire, BEM, BAC, alphabétisation, lecture/écriture, initiation des seniors à Internet |
| `TECH` | bénévolat de compétences numériques: programmation, sites web, design, traduction |
| `SPORT` | sport inclusif et adapté, tournois, basket fauteuil, volley, handball |
| `CULTURE` | enregistrement de livres audio, lecture, patrimoine |
| `ANIMAL_WELFARE` | no mockup content; kept in the enum, no seed campaign |

### 30.2 Per mockup domain

**1. Bénévolat écologique et environnemental**

| Aspect | Value |
|---|---|
| Mockup concepts | nettoyage des plages, des forêts, des quartiers; recyclage; plantation d'arbres; photos avant/après; valorisation des résultats |
| ActivityDomain | `ECOLOGY` (cleanups, recycling), `ENVIRONMENT` (planting, forests) |
| Example campaigns | C02 Nettoyage de la plage de Tichy; C03 Journée de nettoyage du quartier et tri des déchets recyclables; C04 Plantation d'arbres dans la forêt de Yakouren; C05 Nettoyage de la forêt de Chréa; C01 Nettoyage des berges de la Soummam (demo) |
| Seed data | ORG_A Soummam Verte; C01-C05; C01 ongoing with demo token; descriptions mention sacs et gants fournis, point de rendez-vous, résultat attendu |
| i18n keys | `domains.ECOLOGY`, `domains.ENVIRONMENT`, `landing.domains.ecology.title/description` |
| Backend functionality | None new. Before/after photos are **content-only**: represented by the optional `coverImage` static path and by description text. No upload, no gallery, no photo model (spec forbids runtime file writes). Results visibility = existing counts (participants, attended) on campaign pages |

**2. Bénévolat santé et urgence**

| Aspect | Value |
|---|---|
| Mockup concepts | don de sang, soutien psychologique, visite et accompagnement des malades, marathons/courses caritatives, soutien aux personnes atteintes de cancer, formations aux premiers secours |
| ActivityDomain | `HEALTH` |
| Example campaigns | C06 Journée de don de sang; C07 Formation aux premiers secours; C08 Visite solidaire aux patients du service d'oncologie; C09 Course solidaire contre le cancer |
| Seed data | ORG_B Nour Santé; C07 full capacity (waitlist demo); C09 needs funding + sponsored by Pharma Hodna + donations |
| i18n keys | `domains.HEALTH`, `landing.domains.health.*` |
| Backend functionality | None new. Psychological support is **content-only** (C08 description: écoute et soutien moral encadrés par l'équipe soignante). The charity run uses the existing funding fields (`needsFunding`, `fundingGoal`, donations, sponsorships). No medical, appointment or health-record system |

**3. Bénévolat social et entraide**

| Aspect | Value |
|---|---|
| Mockup concepts | distribution alimentaire, Ramadan, aide aux familles démunies, couvertures, maraudes hivernales, bricolage, rénovation, peinture d'écoles, entretien de lieux communautaires (mosquées) |
| ActivityDomain | `HUMANITARIAN` (distributions, maraudes, Ramadan), `SOCIAL` (rénovation, entretien) |
| Example campaigns | C10 Distribution de paniers alimentaires; C11 Maraude hivernale et distribution de couvertures; C12 Action solidaire du Ramadan; C13 Rénovation et peinture de l'école primaire de Seddouk; C14 Nettoyage et entretien de la mosquée du quartier (cancelled, drives the cancellation notice) |
| Seed data | ORG_C El Khir Solidarité; C10/C12/C13 carry caisse history; C14 cancelled with demo volunteer notified |
| i18n keys | `domains.HUMANITARIAN`, `domains.SOCIAL`, `landing.domains.social.*` |
| Backend functionality | None new. Skills needed for renovation (peintres, électriciens) are described in the text, not modelled (the spec has no skills field) |

**4. Bénévolat éducatif et soutien**

| Aspect | Value |
|---|---|
| Mockup concepts | soutien scolaire gratuit, révision du BEM, révision du BAC, alphabétisation, lecture, écriture, accompagnement des personnes âgées à Internet |
| ActivityDomain | `EDUCATION` |
| Example campaigns | C15 Révisions gratuites du BAC; C16 Soutien scolaire pour collégiens : préparation du BEM (ongoing); C17 Atelier d'alphabétisation pour adultes; C19 Initiation des seniors à Internet et aux outils numériques |
| Seed data | ORG_D Savoir Pour Tous; C19 under ORG_E |
| i18n keys | `domains.EDUCATION`, `landing.domains.education.*` |
| Backend functionality | None new. No course, lesson or tutoring system |

**5. Bénévolat de compétences / numérique**

| Aspect | Value |
|---|---|
| Mockup concepts | programmation, création de sites web, design, traduction, autres compétences professionnelles |
| ActivityDomain | `TECH` |
| Example campaigns | C18 Atelier d'initiation à la programmation; C20 Création du site web et traduction des contenus d'une association (draft; design mentioned in description) |
| Seed data | ORG_E Collectif Code Solidaire |
| i18n keys | `domains.TECH`, `landing.domains.skills.*` |
| Backend functionality | None new. No skills matching (not in spec; the ATHAR smart-matching idea is out of scope). Recommendations use `preferredDomains` only |

**6. Bénévolat pour les personnes en situation de handicap**

| Aspect | Value |
|---|---|
| Mockup concepts | accompagnement des personnes à mobilité réduite, accompagnement individuel, inclusion sportive, tournois adaptés, basket fauteuil, volley, handball, enregistrement de livres audio pour malvoyants, participation des personnes handicapées au bénévolat |
| ActivityDomain | `SPORT` (adapted sport), `CULTURE` (audio books), `SOCIAL` (accompaniment) |
| Example campaigns | C21 Tournoi de basket fauteuil; C23 Journée sportive inclusive (volley, handball adaptés in description); C22 Enregistrement de livres audio et accompagnement de personnes malvoyantes |
| Seed data | ORG_F Sport Sans Limites (domains SPORT, SOCIAL, CULTURE); C21 needs funding + sponsor requested |
| i18n keys | `domains.SPORT`, `domains.CULTURE`, `domains.SOCIAL`, `landing.domains.inclusion.*` |
| Backend functionality | None new. No sports-management, team or tournament bracket system; no audio conversion or media storage. Participation of disabled people as volunteers needs no special model: they are ordinary volunteers |

Known limitation (documented, not changed): there is no `ActivityDomain` value dedicated to disability/inclusion, so a volunteer cannot filter "handicap" as a domain. The mockup theme is represented by the ORG_F organization, its campaigns and the landing-page section `landing.domains.inclusion`. Adding an enum value would change the spec's data model; it is not done.

---

## 31. Environment variables

`.env.example` (committed; real `.env` is gitignored):

```
# Neon pooled connection (hostname contains -pooler). Used at runtime.
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15"
# Neon direct connection (no -pooler). Used by prisma db push.
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=15"
# Random string, at least 32 characters. Signs the session cookie.
SESSION_SECRET="replace-with-32-plus-random-characters"
# Public base URL of the deployment.
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

| Var | Used by | Public | Required at build |
|---|---|---|---|
| `DATABASE_URL` | Prisma runtime | no | no (only `prisma generate` runs; it does not connect) |
| `DIRECT_URL` | `prisma db push` (local) | no | no |
| `SESSION_SECRET` | `lib/session.ts` | no | no |
| `NEXT_PUBLIC_APP_URL` | absolute links (optional) | yes | inlined at build if referenced |

All four are set in Vercel Project Settings (Production and Preview) before the first deploy.

---

## 32. Neon strategy

- Account created directly on neon.com (no credit card). One project, region `aws-eu-central-1`, default branch `main`, database `neondb`.
- Copy both strings from the Connect dialog (pooled and direct).
- Local workflow: `npm run db:push` -> `npm run db:seed`. `npm run db:reset` = `prisma db push --force-reset && prisma db seed` (destructive, only before the demo).
- Scale-to-zero: the first query after about 5 minutes idle cold-starts. Mitigations: `connect_timeout=15`, transaction `maxWait`/`timeout`, and the pre-demo warm-up (section 41).
- Free-tier limits are far above demo needs. No Neon branches are required; a Neon dev branch may be used for experiments, but the demo runs on `main`.

---

## 33. Vercel strategy

Clean-build checklist (spec section 4) mapped to concrete files:

| Rule | Implementation |
|---|---|
| Prisma generated during install | `package.json` `"postinstall": "prisma generate"` |
| Build command | Vercel default `next build` (`"build": "next build"`) |
| Node 22 | `"engines": { "node": "22.x" }` and `.nvmrc` = `22` |
| Pooled URL at runtime | `DATABASE_URL` = pooled |
| TS strict, errors fail build | `tsconfig.json` `strict: true`; no `ignoreBuildErrors` |
| Lint never blocks deploy | Next 16 build does not lint (C3) |
| Dynamic DB/session pages | `export const dynamic = "force-dynamic"` in `[locale]/layout.tsx` **and** in every page and route handler that touches DB or session; layout also reads cookies. No `generateStaticParams` for locales, no `setRequestLocale` static optimisation |
| QR components client | `CheckInQr`, `QrScanner`, `ManualTokenForm` are `"use client"`; `html5-qrcode` imported dynamically in `useEffect` |
| No server-only imports in client | `server-only` package in every server lib module |
| No runtime FS writes | nothing writes files; images are static `/public` or color blocks |
| Region | Project Settings -> Functions -> Region `fra1` (Hobby allows one region), next to Neon Frankfurt |
| First deploy early | skeleton (landing + locale switch + DB health check on `/login`) deployed in hour 1 |

`package.json` scripts:

```
dev            next dev
dev:https      next dev --experimental-https     (camera testing on a phone over LAN)
build          next build
start          next start
lint           eslint .
typecheck      tsc --noEmit
check:rtl      grep for forbidden physical Tailwind classes in src/, fail on match
test           tsx --test src/**/*.test.ts
postinstall    prisma generate
db:push        prisma db push
db:seed        prisma db seed
db:reset       prisma db push --force-reset && prisma db seed
seed:verify    tsx prisma/verify-seed.ts
```

---

## 34. Error handling

- `src/lib/errors.ts`: `ErrorCode` string union (section 17.3), `class DomainError extends Error { code; details? }`, and `toFailure(e)`:
  - `DomainError` -> `fail(code, details)`.
  - `Prisma.PrismaClientKnownRequestError` `P2002` -> context-specific (`EMAIL_TAKEN` in signups, idempotent re-read in attendance/favorites, otherwise `VALIDATION`); `P2025` -> `NOT_FOUND`.
  - anything else -> `console.error` with a short context tag, then `fail("INTERNAL")`. Stack traces and Prisma messages are never returned to the client.
- `src/lib/result.ts`: `ActionResult<T>`, `ok(data)`, `fail(code, extra?)`.
- Actions: wrapped by `runAction(fn)`; they never throw to the client except Next control-flow (`redirect`, `notFound`).
- Route handlers: `DomainError` code -> HTTP status map (section 17); body always `{ ok, data | error }`.
- UI: forms display `errors.<code>` and per-field `fieldErrors`; `[locale]/error.tsx` catches unexpected render errors with a retry button; `not-found.tsx` for missing/unowned resources.
- Pages call `notFound()` for missing campaigns and for org resources owned by another org.

---

## 35. Transaction boundaries

| Operation | Boundary | Why |
|---|---|---|
| `redeemToken` (QR + manual token) | one interactive tx: validate token, claim token, `awardAttendance` | spec 10.3; no token consumed without points, no points without token claim |
| `markAttendedManually` | `awardAttendance` opens its own tx | same body as above |
| `awardAttendance` | CheckIn + ledger + profile increments + enrollment ATTENDED + POINTS_AWARDED + RANK_UP | spec section 8 |
| `enroll` | read capacity + upsert enrollment + notification | seat decision and write consistent |
| `addParticipantByName` | upsert enrollment + notification | atomic side effect |
| `createCampaign` | campaign + recommendation notifications | no notifications for a failed campaign |
| `deleteCampaign` (cancel) | status update + cancellation notifications | cancel and notify together, idempotent |
| `processSponsorship` / `processDonation` | tx only for `CONFIRMED` update + org notification; `PENDING` create and the 900 ms charge are outside | never hold a pooled connection across the mock delay |
| `signupVolunteer` / `signupOrganization` | single nested create (atomic) | user + profile together |
| `withdraw`, `removeParticipant`, `toggleFavorite`, `markRead`, `markAllRead`, `updateCampaign`, `issueCheckInToken` | single statement, no explicit tx | one write |
| Seed | sequential; wipe first | re-runnable |

All interactive transactions use `{ maxWait: 10_000, timeout: 15_000 }`.

---

## 36. Revalidation strategy

All pages are dynamic, so revalidation mainly clears the client Router Cache so the next navigation shows fresh data. `src/lib/revalidate.ts` exposes named groups built on `revalidatePath("/[locale]/<path>", "page")` (the pattern form covers all three locales):

| Group | Paths |
|---|---|
| `all` | `revalidatePath("/[locale]", "layout")` |
| `feeds` | `/[locale]/volunteer/feed`, `/[locale]/campaigns`, `/[locale]` |
| `campaign(id)` | `/[locale]/campaigns/[id]` |
| `volunteerProfile` | `/[locale]/volunteer/profile`, `/[locale]/leaderboard` |
| `inbox` | `/[locale]/volunteer/inbox`, `/[locale]/org/inbox`, plus layout (unread badge) |
| `orgDashboard` | `/[locale]/org/dashboard` |
| `orgCampaigns` | `/[locale]/org/campaigns` |
| `orgCampaign(id)` | `/[locale]/org/campaigns/[id]/participants`, `orgDashboard` |
| `sponsorBrowse` | `/[locale]/sponsor/browse` |
| `caisse(id)` | `/[locale]/org/caisse`, `/[locale]/org/dashboard`, `/[locale]/sponsor/browse`, `/[locale]/campaigns/[id]`, `inbox` |
| `attendance(id)` | `orgCampaign(id)`, `volunteerProfile`, `inbox`, `campaign(id)` |

Per action: see section 15. Route handlers (`/api/checkin`, `/api/pay`) run the same groups after commit. Fallback if a view is ever stale during the demo: the `all` group.

---

## 37. Security considerations

Demo-grade by design, with the following real protections:

- Quick login allows impersonation (intended). Everything else is enforced server-side: role checks, org ownership of campaigns/enrollments/tokens, notification ownership in `WHERE` clauses, saved card ownership.
- Session cookie: HMAC-SHA256 with `SESSION_SECRET`, constant-time comparison, httpOnly, sameSite lax, secure in production. No secret in `NEXT_PUBLIC_*`.
- Server Actions: Next.js built-in Origin/Host check (CSRF protection for actions). Route handlers: session cookie is sameSite lax, so cross-site POSTs carry no session; requests must be JSON.
- QR: opaque 192-bit random token, single-use, TTL 2 h, no PII, ownership check before revealing token state.
- Payments: amounts computed server-side from `SponsorshipPack` or validated bounds; no card number accepted or stored; the mock provider is behind an interface.
- Input: Zod on every entry point; unknown keys stripped; string lengths bounded; React escapes all rendered text; notification params are rendered as text, never as HTML.
- Data exposure: queries `select` only the fields a page needs (no emails on public pages; volunteer emails never shown to orgs).
- `server-only` prevents Prisma or secrets from being bundled for the browser.
- No runtime file writes, no uploads.

---

## 38. Testing strategy

Proportionate to a hackathon; the build and the rehearsed demo are the main gates.

1. **Static**: `npm run typecheck`, `npm run build` (must be green before every push), `npm run check:rtl`.
2. **Unit** (`tsx --test`, no extra framework): `src/lib/tiers.test.ts` covers tier boundaries (0, 299, 300, 799, 800, 1799, 1800, 3999, 4000, 10000) and progress. Pure helpers only.
3. **Scripted DB smoke** (P1, `scripts/smoke.ts`, run locally against Neon, then re-seed): issue token for the demo volunteer -> `redeemToken` -> assert points 830, tier committed, `RANK_UP` exists, rank equals the post-check-in rank printed by `seed:verify` -> redeem again -> `TOKEN_USED` -> `markAttendedManually` on same enrollment -> `alreadyAttended`. Also cancel C02 -> count `CAMPAIGN_CANCELLED` rows. Calls `lib` functions directly (no HTTP, no cookie forging).
4. **Manual acceptance**: every spec acceptance criterion (section 7 of the spec) walked on the deployed URL, on two real phones for the QR flow.

---

## 39. P0 / P1 / P2 implementation order

Each step ends with `npm run build` green and a commit. Deploy after steps 1, 5, 8, 11.

**P0**

1. Skeleton: `create-next-app` (TS, Tailwind v4, App Router, `src/`), shadcn init, next-intl (`routing`, `request`, `navigation`, `proxy.ts`, `[locale]/layout.tsx` with `lang`/`dir`, language switcher), `fr/en/ar.json` stubs, `.nvmrc`, engines, postinstall, `.env.example`, `check:rtl`. Deploy to Vercel with env vars set.
2. Prisma: schema (section 10), `lib/prisma.ts`, `db push` to Neon.
3. Seed (section 29) and `db:seed`.
4. Session + quick login: `lib/session.ts`, `actions/auth.ts`, `/login`, role homes, `requireRole`, `getActor`, header with role nav.
5. Shared core: `result.ts`, `errors.ts`, `validation.ts`, `revalidate.ts`, `domains.ts`, `tiers.ts` (+ test), `notifications.ts`, `constants.ts`. Deploy.
6. Volunteer: feed + public feed + detail, `enroll`/`withdraw`/`toggleFavorite` with `useOptimistic`, profile (points, tier, rank, history, upcoming).
7. Attendance core: `lib/points.ts` (`awardAttendance`, rank, leaderboard), `lib/checkin.ts`, `issueCheckInToken`, `/volunteer/checkin/[campaignId]` with `CheckInQr`.
8. Org: onboarding (and volunteer onboarding), dashboard, campaigns list + create + edit + cancel (with notifications), participants page with add/remove/mark attended. Deploy.
9. Scanner: `/api/checkin`, `/org/scanner` with `QrScanner`, `ManualTokenForm`, `CheckInResultCard`, participant-list note.
10. Arabic RTL pass on every P0 page; `fr.json` complete for P0 keys.
11. End-to-end on two phones on the deployed URL. Deploy.

**P1**

12. Inbox pages (volunteer + org), `markRead`/`markAllRead`, unread badge.
13. Payments: `lib/payments.ts`, `lib/contributions.ts`, `lib/caisse.ts`.
14. Sponsor browse + packs + checkout (`purchaseSponsorship`), `/api/pay`.
15. Donation form on campaign detail (`donate`).
16. Org caisse page; dashboard total raised.
17. Leaderboard page.
18. Scripted smoke test.

**P2** (only when P0 and P1 are green)

19. Full EN/AR translation of UI and pack/notification keys.
20. Rewards catalog (display-only first, redemption last).
21. No-show: `markNoShow(enrollmentId)` for orgs.
22. Waitlist promotion in `withdraw`/`removeParticipant`: promote the oldest `WAITLISTED` to `ENROLLED` + `ENROLLMENT_CONFIRMED`, inside the same transaction.
23. Framer Motion polish, empty states.

Cut from the bottom of P2 upward if time runs out. Never cut a P0 fallback (manual token, manual attendance, demo token).

---

## 40. Definition of done

- Every P0 acceptance criterion of the spec passes on the **deployed Vercel URL**.
- QR check-in works cross-device (volunteer phone shows QR, org phone scans) with working manual token fallback and manual attendance fallback, and the seeded demo token works.
- Points, tier, rank and inbox visibly update after a check-in.
- Creating a campaign shows it in the volunteer feed; cancelling notifies enrolled volunteers.
- Build is green (`tsc` strict, no ignored errors), no server-only import in client code, no static prerender of DB/session pages.
- Arabic switch flips the entire layout to RTL without breakage; `check:rtl` passes; French fully translated.
- No emoji anywhere (UI, seed, code comments, notifications).
- No full card number accepted or stored.
- P1: sponsor pack purchase and donations appear in the caisse with correct totals and notify the org; leaderboard live.

---

## 41. Pre-demo QA

- [ ] `npm run db:reset` run on the demo morning (fresh relative dates, fresh demo token).
- [ ] Production URL loads; no console errors on landing, login, feed, profile, scanner, caisse.
- [ ] Warm Neon 30-60 s before presenting (open `/fr/login`, which queries the DB).
- [ ] Org phone: logged in as `org.demo@tawa3.dz` on the production URL, camera permission granted on `/fr/org/scanner`, tested in venue lighting.
- [ ] Volunteer phone: logged in as `benevole.demo@tawa3.dz`, `/fr/volunteer/checkin/<C01 id>` shows a QR, screen brightness up.
- [ ] `npm run seed:verify` passes against the production database and its printed ranks match section 29.7.
- [ ] Happy path rehearsed: volunteer enrolls in a campaign -> shows QR (C01) -> org scans -> card shows name, +150, 830 -> volunteer profile shows 830, tier "Engagé", the rank printed by `seed:verify`, inbox has "points" and "palier" notifications.
- [ ] Manual token fallback: type `TAWA3-DEMO-7K2Q9XHM` (only if the live QR was not used on C01; otherwise it answers "already checked in", which is also a valid demonstration).
- [ ] Manual attendance from the participant list works.
- [ ] Org creates a campaign live -> appears in volunteer feed; cancel it -> volunteer inbox shows the cancellation.
- [ ] Sponsor (`sponsor.demo@tawa3.dz`) buys PRO on C02 (Nettoyage de la plage de Tichy) -> appears in the demo org's caisse with correct total -> demo org inbox shows the notice.
- [ ] Donation on a public campaign page appears in the caisse.
- [ ] Switch to AR on every demo page: layout RTL, nothing overlapping, digits readable.
- [ ] No emoji in UI or seed text (`grep -P "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]"` returns nothing).
- [ ] Backup sheet printed: demo accounts, demo token, C01 URL.

---

## Appendix A. Assumptions (spec silent; smallest reasonable choice)

| # | Assumption |
|---|---|
| A1 | Occupied seats count `ENROLLED` + `ATTENDED` (C5). |
| A2 | Enrollment notification is sent only when the result is `ENROLLED`, not `WAITLISTED`. |
| A3 | Re-enrolling after `WITHDRAWN` reuses the same row (unique constraint) and resets `enrolledAt`. |
| A4 | Withdrawal and removal are forbidden after `ATTENDED`; points are never removed. |
| A5 | Check-in accepts enrollments in `ENROLLED`, `WAITLISTED`, `NO_SHOW`; rejects `WITHDRAWN` and missing (walk-ins off, `ALLOW_WALK_IN = false`). WAITLISTED eligibility is a documented decision, see section 21.5. |
| A6 | A check-in token is reused while more than 10 minutes remain; TTL is 120 minutes. |
| A7 | Check-in is allowed while the campaign is `PUBLISHED`, `ONGOING` or `COMPLETED` (late scanning after marking completed); rejected for `DRAFT` and `CANCELLED`. |
| A8 | Cancellation notifies `ENROLLED` and `WAITLISTED` volunteers; enrollment rows keep their status. |
| A9 | `addParticipantByName` matches full name case-insensitively and exactly; ambiguous names return candidates; org additions override capacity. |
| A10 | Signup email optional; generated placeholder when empty. |
| A11 | Sponsors are seeded only (no sponsor signup in the spec). |
| A12 | `CAMPAIGN_REMINDER` exists only in seed data (no scheduler allowed on serverless without extra infrastructure). |
| A13 | `createCampaign` (published) sends `CAMPAIGN_RECOMMENDATION` to up to 100 volunteers whose preferred domains include the campaign domain. |
| A14 | Donations use the logged-in user's saved card when present, otherwise a mock card built from the donor name; no card input for donors. |
| A15 | Campaign `phase` for the dashboard is computed from status and dates; stored status only changes by explicit org action. |
| A16 | National rank ties are broken by `id` so every volunteer has a unique 1-based position. |
| A17 | Seed has 23 campaigns (slightly above the spec's approximate 15-20) to cover every mockup example. |
| A18 | The demo token lives 30 days (explicit stage fallback); all other tokens follow the 2 h TTL. |

## Appendix B. Final architecture check

| Check | Result |
|---|---|
| `BACKEND_SPEC.md` read completely (sections 0-15) | Yes |
| Repository inspected (`main`, 34 files, no app) | Yes (section 2) |
| `backend` branch exists | Yes, created from `main` at `0607c12` |
| Next.js app created from the spec, not from existing code | Yes |
| Vercel serverless compatible (no server, no in-memory state, no FS writes, no cron, no websockets) | Yes |
| Prisma model matches the spec | Yes, verbatim (section 10); Prisma pinned to 6.19 to keep it verbatim (C1) |
| Mockup domains mapped to existing `ActivityDomain` values | Yes (section 30), no enum change |
| Seed data French-first, Algerian context, no emoji | Yes (section 29) |
| QR flow completely defined (issue, render, scan, manual, redeem, errors, fallbacks) | Yes (sections 17.1, 21) |
| One attendance source of truth | Yes, `awardAttendance` (section 22), used by QR and manual paths |
| Payments mocked behind `PaymentProvider` | Yes (section 25) |
| Auth demo-grade (`login`, `getCurrentUser`, `logout`, `requireRole`) | Yes (section 11) |
| Arabic RTL from the start | Yes (sections 27, 28, step 1 of P0) |
| P0 priorities clear | Yes (section 39) |
| No unnecessary systems invented | Yes: no photo, media, sports, health, skills-matching, admin, scheduler or migration systems |
| No co-author or tool attribution in commits or docs | Yes |

## Appendix C. P0 implementation notes

Status: P0 code complete on `backend`, verified locally against PostgreSQL 17 (production build + HTTP tests). Not yet deployed: the Vercel deploy needs the Neon connection strings and a Vercel project (section 32/33).

What was verified locally:

- `next build` green; every DB/session route is dynamic (`ƒ`), only `/_not-found` is static.
- `tsc` strict clean, `npm test` (tier boundaries) green, `check:rtl` green (and proven to fail on `pl-`, `ml-`, `right-`, `text-left`), no emoji in `src/`, `prisma/`, docs.
- `/api/checkin`: 401 anonymous, 403 volunteer, 400 bad JSON, 404 unknown token, 403 other organization's token, 200 with `{ volunteerName, pointsAwarded: 150, newTotal: 830, tierKey: "tier.committed", rankUp: true }` for the demo token, 409 on reuse.
- Profile after check-in shows 830 points and rank "6 sur 12"; inbox shows the points and tier notifications. `<html lang="ar" dir="rtl">` on Arabic pages.
- Server Actions over HTTP: enroll into the full campaign -> `WAITLISTED` (idempotent on repeat); waitlisted volunteer gets a QR token (reused on reload), scanned by the owning org -> 200 with `wasWaitlisted: true`; withdraw / re-enroll; withdraw after attendance -> `ALREADY_ATTENDED`; favorite toggles; `markAttendedManually` awards once then returns `alreadyAttended`; volunteer calling an org action -> `FORBIDDEN`; add participant by name (case-insensitive) and unknown name; create campaign (appears in public feed), cancel (1 volunteer notified), cancel again (0, idempotent); both signups create rows, set the cookie and redirect to the role home.
- Ledger invariant (`sum(PointsTransaction) == totalPoints`) still holds after all these writes.

Implementation details decided during P0 (no spec conflict):

- `lib/action.ts` (`runAction`, `parse`) and `lib/ranking.ts` were added: the first centralises the action pipeline, the second keeps the ranking order in a pure module so `prisma/verify-seed.ts` uses the exact same code as the app (modules marked `server-only` cannot run in a plain Node script).
- Campaign dates are entered and shown in Algeria time (`lib/dates.ts`) regardless of device or server time zone; the form sends absolute ISO timestamps.
- The scanner's manual token form and result card live inside `QrScanner` (one client state machine) instead of separate files.
- The session cookie is `Secure` in production. Phone testing over a LAN IP therefore needs `npm run dev:https` or the deployed HTTPS URL.
- `NextIntlClientProvider` currently ships all message namespaces to the client (about 20 KB). Acceptable for the demo; can be narrowed to client namespaces later.
- English and Arabic are complete for the P0 namespaces (navigation, campaigns, profile, tiers, inbox, notifications, check-in, scanner, errors, validation, landing, onboarding). The organization pages, caisse, sponsor and donation namespaces fall back to French until the P2 translation pass.
- P1 items not started yet: payments (`lib/payments.ts`, `lib/contributions.ts`), `/api/pay`, sponsor browse/checkout, donate form, caisse page, `scripts/smoke.ts`.
