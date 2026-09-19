# TAWA3 — Backend Build Specification (Hackathon Prototype)

> Volunteer-matching platform connecting **Volunteers**, **Organizations**, and **Sponsors**.
> This document is the single source of truth for the backend/dev agent. Build exactly what is here.
> **You have < 12 hours. Follow the PRIORITY TIERS in section 11. Do not gold-plate P2 work before P0 is green.**

---

## 0. NON-NEGOTIABLE CONSTRAINTS (read first, violate none)

1. **100% free, zero credit card, zero paid service.** Neon free tier + Vercel Hobby only.
2. **Deploy must always build clean and deploy instantly on Vercel.** A red build is a P0 blocker — stop and fix before anything else.
3. **NO EMOJI anywhere** — not in UI, not in seed data, not in code comments, not in notification text. Use text labels, icons (lucide-react), dots, and counts instead.
4. **Native support for 3 languages: French (default), English, Arabic.** Arabic requires full **RTL** layout.
5. **No real payments.** All payment flows are mocked behind an interface (section 9).
6. **Auth is faked** (quick-login, section 6). All *data operations* are real against Postgres.
7. **This runs on Vercel serverless.** No Express server, no long-running processes, no in-memory state that must survive between requests, no runtime filesystem writes. State lives in Postgres or static `/public` assets.

---

## 1. LOCKED TECH STACK

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js (App Router) + React** | Latest stable. Backend lives *inside* Next via Route Handlers + Server Actions. **No separate server.** |
| Language | **TypeScript, strict mode** | Non-negotiable. `tsc` errors must fail the build (do not ignore). |
| Styling | **Tailwind CSS + shadcn/ui** | Use **logical properties only** (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`) so RTL works for free. Never `pl-`/`pr-`/`ml-`/`mr-`. |
| Animation | **Framer Motion** | For polish. |
| i18n | **next-intl v4** | App Router native, `[locale]` routing, RTL via `<html dir>`. |
| DB | **PostgreSQL on Neon** (free tier, no CB) | Serverless-friendly, built-in pooling. |
| ORM | **Prisma** | Typed schema = the "DB architecture" deliverable. |
| Validation | **Zod** (+ react-hook-form on client) | Validate every Server Action / Route Handler input. |
| QR generate | **`qrcode`** (client render to canvas/svg) | Volunteer side. |
| QR scan | **`html5-qrcode`** (or `BarcodeDetector` with fallback) | Org side. `"use client"`, requires HTTPS (Vercel provides it). |
| Session | Minimal signed httpOnly cookie via `next/headers` `cookies()` | Demo-grade only. Not production auth. |

**CUT / DO NOT BUILD:** Three.js / any 3D, NextAuth full flow, real SATIM/Edahabia integration, email sending, file upload to disk, websockets/realtime (poll or reload instead).

**State management:** rely on React Server Components for reads + Server Actions + `revalidatePath` for writes. Use `useOptimistic` for enroll/favorite snappiness. Add Zustand **only** for the QR scanner client state if needed. No Redux, no TanStack Query.

---

## 2. ARCHITECTURE OVERVIEW

- **Reads:** Server Components query Prisma directly.
- **Mutations:** Server Actions (`"use server"`) as the default. Validate input with Zod, then Prisma write, then `revalidatePath`.
- **Cross-device / public endpoints:** Route Handlers under `/app/api/*` (the QR check-in endpoint the org phone posts to, the mock payment callback).
- **Any page that reads cookies/session/DB must be dynamic.** Add `export const dynamic = "force-dynamic"` (or it reads `cookies()`, which already forces dynamic). **Do not let Next try to statically prerender a DB/session page at build time — that is a classic Vercel build failure.**

### Folder structure
```
src/
  middleware.ts                 # next-intl locale routing
  app/
    [locale]/
      layout.tsx                # sets <html lang dir>, NextIntlClientProvider
      page.tsx                  # landing
      login/page.tsx            # quick-login (dev)
      campaigns/page.tsx        # public feed
      campaigns/[id]/page.tsx   # campaign detail + donate
      volunteer/
        feed/page.tsx
        profile/page.tsx
        inbox/page.tsx
        checkin/[campaignId]/page.tsx   # shows the volunteer's QR
      org/
        onboarding/page.tsx     # create org account
        dashboard/page.tsx
        campaigns/page.tsx      # CRUD
        campaigns/[id]/participants/page.tsx
        scanner/page.tsx        # camera QR scan (client)
        caisse/page.tsx
      sponsor/
        browse/page.tsx
        checkout/[campaignId]/page.tsx
    api/
      checkin/route.ts          # POST { token } -> record attendance
      pay/route.ts              # POST mock payment
  lib/
    prisma.ts                   # singleton client
    session.ts                  # getCurrentUser, login, logout
    points.ts                   # gamification engine
    payments.ts                 # PaymentProvider interface + Mock
    notifications.ts            # create notification helper
    domains.ts                  # ActivityDomain labels
  components/                   # shared UI (shadcn + custom)
  messages/
    fr.json  en.json  ar.json
prisma/
  schema.prisma
  seed.ts
```

### `lib/prisma.ts` — singleton (prevents connection blowup in dev/serverless)
```ts
import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
```

---

## 3. ACCOUNTS & ENV SETUP (deploy-critical — do this first)

### Neon (guaranteed no-CB path)
1. Sign up at **neon.com** directly (no credit card required — confirmed 2026). *Prefer this over the Vercel Marketplace path, which can surface confusing "third-party paid app" terms.*
2. Create a project. Copy **two** connection strings:
   - **Pooled** (hostname contains `-pooler`) → runtime. This is what prevents `too many connections` on serverless.
   - **Direct** (no `-pooler`) → migrations / `db push`.

### Environment variables (set in Vercel Project Settings **before** first deploy, and in local `.env`)
```
DATABASE_URL="postgresql://...-pooler.../neondb?sslmode=require"   # POOLED
DIRECT_URL="postgresql://.../neondb?sslmode=require"              # DIRECT
SESSION_SECRET="<random 32+ char string>"
NEXT_PUBLIC_APP_URL="https://<your-app>.vercel.app"
```
- **Never** put secrets in `NEXT_PUBLIC_*`. Only `NEXT_PUBLIC_APP_URL` is public.

### Prisma datasource (schema.prisma)
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled
  directUrl = env("DIRECT_URL")     // direct, used by migrate/db push
}
generator client { provider = "prisma-client-js" }
```

### Schema sync strategy (hackathon speed)
- Use **`prisma db push`** (not full migrations) run **locally against Neon**, then `prisma db seed`.
- Vercel only runs `prisma generate` + `next build`. **Do not run migrations on Vercel.**

---

## 4. CLEAN-BUILD RULES FOR VERCEL (checklist — all must hold)

- [ ] `package.json` has `"postinstall": "prisma generate"` — **without this, Vercel builds fail with "Prisma Client not generated".**
- [ ] Build command: `next build` (Vercel default). Prisma is generated in postinstall.
- [ ] Pin Node: add `"engines": { "node": "22.x" }` and a `.nvmrc` with `22`.
- [ ] Runtime uses the **pooled** `DATABASE_URL`.
- [ ] TypeScript strict; **fix all type errors** (do not set `ignoreBuildErrors`).
- [ ] Pragmatic exception: `eslint: { ignoreDuringBuilds: true }` in `next.config` so a lint warning never blocks a deploy. (Fix lint later; do not let it kill the demo.)
- [ ] Every DB/session-reading page is dynamic (reads `cookies()` or `export const dynamic = "force-dynamic"`). No accidental static prerender of dynamic data.
- [ ] Camera scanner and QR generator components are `"use client"`.
- [ ] No imports of server-only modules (Prisma, `fs`, `next/headers`) inside client components.
- [ ] No runtime filesystem writes. Mock images = static files in `/public` or placeholder color blocks.
- [ ] First deploy done EARLY (deploy the empty skeleton within the first hour) — never leave the first deploy for the end.

---

## 5. DATA MODEL (full Prisma schema)

> Denormalize where it speeds the demo. Points are logged (ledger) **and** cached on the profile.

```prisma
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
  id              String           @id @default(cuid())
  userId          String           @unique
  user            User             @relation(fields: [userId], references: [id])
  fullName        String
  city            String?
  birthYear       Int?
  preferredDomains ActivityDomain[]
  bio             String?
  totalPoints     Int              @default(0)
  eventsCompleted Int              @default(0)

  enrollments     Enrollment[]
  favorites       Favorite[]
  pointsLog       PointsTransaction[]
  checkIns        CheckIn[]
}

model OrganizationProfile {
  id          String           @id @default(cuid())
  userId      String           @unique
  user        User             @relation(fields: [userId], references: [id])
  name        String
  domains     ActivityDomain[]
  description String?
  city        String?
  contactPhone String?
  verified    Boolean          @default(false)  // cosmetic for demo

  campaigns   Campaign[]
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
  id            String         @id @default(cuid())
  orgId         String
  org           OrganizationProfile @relation(fields: [orgId], references: [id])
  title         String
  description   String
  domain        ActivityDomain
  city          String?
  location      String?
  startAt       DateTime
  endAt         DateTime
  capacity      Int            @default(0)   // 0 = unlimited
  pointsValue   Int            @default(100) // points awarded on attendance
  status        CampaignStatus @default(PUBLISHED)
  coverImage    String?        // /public path or null

  needsFunding  Boolean        @default(false)
  fundingGoal   Int?           // in DZD
  sponsorRequested Boolean     @default(false)

  createdAt     DateTime       @default(now())

  enrollments   Enrollment[]
  favorites     Favorite[]
  checkIns      CheckIn[]
  checkInTokens CheckInToken[]
  sponsorships  Sponsorship[]
  donations     Donation[]
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

// What the QR encodes: an opaque, single-use, short-lived token. No PII in the QR.
model CheckInToken {
  id          String   @id @default(cuid())
  token       String   @unique @default(cuid())
  volunteerId String
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id])
  expiresAt   DateTime
  usedAt      DateTime?
  createdAt   DateTime @default(now())
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
  reason      String           // e.g. "ATTENDED:<campaignId>"
  createdAt   DateTime         @default(now())
}

model SponsorshipPack {
  id       String      @id @default(cuid())
  tier     SponsorTier @unique
  priceDZD Int
  // benefits rendered from i18n keys by tier; store keys, not translated text
  benefitKeys String[]
}

model Sponsorship {
  id          String             @id @default(cuid())
  sponsorId   String
  sponsor     SponsorProfile     @relation(fields: [sponsorId], references: [id])
  campaignId  String
  campaign    Campaign           @relation(fields: [campaignId], references: [id])
  tier        SponsorTier
  amountDZD   Int
  status      ContributionStatus @default(PENDING)
  createdAt   DateTime           @default(now())
}

model Donation {
  id          String             @id @default(cuid())
  campaignId  String
  campaign    Campaign           @relation(fields: [campaignId], references: [id])
  donorName   String             // free text; individual donors are not required to have accounts
  amountDZD   Int
  method      String             @default("EDAHABIA_MOCK")
  status      ContributionStatus @default(PENDING)
  createdAt   DateTime           @default(now())
}

// Mock only. NEVER store a real card number. last4 + holder name only.
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
  titleKey   String           // i18n key; interpolate params client-side
  bodyKey    String
  params     Json?            // e.g. { campaignTitle: "...", points: 100 }
  read       Boolean          @default(false)
  campaignId String?
  createdAt  DateTime         @default(now())
}
```

---

## 6. AUTH MODEL (faked — quick-login)

- No passwords, no email verification. Demo-grade only.
- `lib/session.ts`:
  - `login(userId)` → sets a signed httpOnly cookie `session` containing `userId` (sign with `SESSION_SECRET`, e.g. HMAC).
  - `getCurrentUser()` → reads cookie, verifies signature, returns `User` (with role relation) or `null`.
  - `logout()` → clears cookie.
- `/login` page: lists seeded accounts grouped by role with a "Continue as X" button → calls `login()` Server Action → redirects to that role's home. Also links to the two live signup flows (volunteer + org onboarding).
- **Role gating:** a helper `requireRole(role)` used at the top of each protected page/action; redirect to `/login` if mismatch.
- **Signup flows write for real** (volunteer onboarding, org onboarding). After create, auto-login the new user and redirect to their dashboard so the entered data is visibly live.

---

## 7. FEATURE SPECS BY ROLE

> Each feature lists: **Data**, **Server action / endpoint**, **Rules**, **Acceptance**.
> "Acceptance" is the demo-passing bar. If it passes acceptance, move on.

### 7.1 VOLUNTEER

**A. Campaign feed**
- Data: `Campaign` where `status IN (PUBLISHED, ONGOING)`, newest first, with org name + enrolled/favorite flags for current user.
- Rules: show capacity remaining (`capacity - count(ENROLLED)`), domain badge, city, dates.
- Acceptance: logged-in volunteer sees a populated feed; each card shows enroll + favorite controls reflecting current state.

**B. Enroll / Withdraw / Favorite**
- Server actions: `enroll(campaignId)`, `withdraw(campaignId)`, `toggleFavorite(campaignId)`.
- Rules:
  - `enroll`: create `Enrollment(ENROLLED)`; if capacity full → `WAITLISTED`. On success create `ENROLLMENT_CONFIRMED` notification. Points are **NOT** awarded on enroll (only on attendance — prevents gaming).
  - `withdraw` ("désistement"): set enrollment `WITHDRAWN`. Free the slot.
  - `toggleFavorite`: create/delete `Favorite`.
  - Use `useOptimistic` on the client for instant feedback; `revalidatePath` after.
- Acceptance: enroll → button flips to "Enrolled" + count updates; withdraw reverses it; favorite persists across reload.

**C. Profile + gamification stats**
- Data: `VolunteerProfile` (totalPoints, eventsCompleted), computed **national rank** (position when all volunteers ordered by `totalPoints desc`), current **tier** (section 8), next-tier progress, recent `PointsTransaction`, list of attended + upcoming campaigns.
- Acceptance: profile shows real numbers that change after a QR check-in.

**D. Inbox**
- Data: `Notification` for current user, unread first, unread count badge (a number/dot, no emoji).
- Server action: `markRead(id)` / `markAllRead()`.
- Acceptance: recommendations + a cancellation notice are visible; marking read updates the badge.

**E. Check-in QR (volunteer side)**
- Page `/volunteer/checkin/[campaignId]`: only if enrolled. Server action `issueCheckInToken(campaignId)` creates a `CheckInToken` (expires in ~2h, single-use) and returns the token string. Client renders it as a QR with `qrcode`.
- **QR payload = the opaque token string only.** No name, no IDs derivable to PII.
- Acceptance: enrolled volunteer opens the page and sees a scannable QR.

### 7.2 ORGANIZATION

**A. Onboarding (live signup)**
- Form: org name, domains (multi-select), description, city, contact. Zod-validated.
- Action: create `User(ORGANIZATION)` + `OrganizationProfile`, auto-login, redirect to dashboard.
- Acceptance: entered org name/domains appear immediately on the dashboard.

**B. Dashboard**
- Data: this org's campaigns split into **ongoing / upcoming / history (COMPLETED/CANCELLED)**, participant counts per campaign, totals (campaigns run, total volunteers engaged, total raised in caisse).
- Acceptance: dashboard renders real aggregates from seeded + created campaigns.

**C. Campaign CRUD**
- Actions: `createCampaign`, `updateCampaign`, `deleteCampaign` (soft-delete acceptable: set `CANCELLED`; hard delete also fine for demo but cascade carefully).
- Create form includes: title, description, domain, city/location, start/end, capacity, pointsValue, `needsFunding` + `fundingGoal`, `sponsorRequested`.
- Rules: **Cancelling a campaign creates `CAMPAIGN_CANCELLED` notifications for every enrolled volunteer.** (This is the inbox demo moment — wire it.)
- Acceptance: create a campaign live → it appears in the volunteer feed; cancel it → enrolled volunteers get an inbox notice.

**D. Participants management**
- Page lists enrollments for a campaign with status.
- Actions: `addParticipantByName(campaignId, volunteerName)` (look up volunteer by name; if found, create enrollment), `removeParticipant(enrollmentId)`, `markAttendedManually(enrollmentId)`.
- **`markAttendedManually` is the QR fallback** — it must run the exact same attendance+points logic as a scan (section 8/10). Reuse one function.
- Acceptance: add a volunteer by name → appears in list; mark attended → their points go up.

**E. QR scanner (org side)**
- Page `/org/scanner`: `"use client"`, opens camera via `html5-qrcode`. On decode → POST `/api/checkin { token }`.
- **Mandatory fallbacks on the same page:** (1) a manual text input to paste/type the token, (2) a note that attendance can also be set from the participant list. Camera failure must never dead-end the demo.
- On success, show the volunteer's name + points awarded as a confirmation card.
- Acceptance: scanning a volunteer's QR (or pasting the token) marks them ATTENDED and awards points, visible on the volunteer's profile after reload.

**F. Caisse**
- Data: for each funded campaign — list of contributions (Donations + confirmed Sponsorships) with contributor name, amount, type, date; total raised; % of `fundingGoal`.
- Acceptance: donations/sponsorships appear here with a correct running total.

### 7.3 SPONSOR (company / supporter)

- Demo runs on mostly mock data, but the flows are real writes.
- **A. Browse:** campaigns with `sponsorRequested = true` or `needsFunding = true`, showing funding progress.
- **B. Packs:** three tiers from `SponsorshipPack` (STARTER / PRO / MAX). Benefits rendered from i18n `benefitKeys` per tier (no emoji; text list).
- **C. Checkout (mocked):** pick a campaign + tier → confirm with a **pre-saved Edahabia card** (`SavedCard`, mock) → calls the mock payment provider (section 9) → on success create `Sponsorship(CONFIRMED)`, credit the campaign caisse, notify the org (`SPONSOR_CONFIRMED`).
- Acceptance: a sponsor buys a PRO pack for a campaign → it shows up in that campaign's caisse and the org gets a notification.

**Individual donations (on public campaign page):** amount + donor name → mock payment → `Donation(CONFIRMED)` → caisse. Same provider.

---

## 8. GAMIFICATION ENGINE (`lib/points.ts`)

Single source of truth for awarding points. Called by both QR scan and manual "mark attended".

```
awardAttendance(volunteerId, campaign):
  - if CheckIn already exists for (volunteer, campaign) -> no-op (idempotent)
  - create CheckIn(pointsAwarded = campaign.pointsValue)
  - create PointsTransaction(+campaign.pointsValue, reason "ATTENDED:<id>")
  - VolunteerProfile.totalPoints += pointsValue; eventsCompleted += 1
  - set Enrollment.status = ATTENDED
  - create POINTS_AWARDED notification
  - if tier increased -> create RANK_UP notification
  - do all of the above in a single prisma.$transaction
```

**Tiers** (by totalPoints; names are i18n keys, no emoji):
| Tier key | Min points |
|---|---|
| `tier.newcomer` | 0 |
| `tier.contributor` | 300 |
| `tier.committed` | 800 |
| `tier.champion` | 1800 |
| `tier.legend` | 4000 |

**National rank** = 1-based position of the volunteer when all `VolunteerProfile` are ordered by `totalPoints desc, eventsCompleted desc`. Compute on read (fine at demo scale). Expose a **leaderboard** view (top N) for the "top national" claim.

**Rewards (P2, keep light):** a static catalog (name key + pointsCost) shown on the profile as "redeemable" — redemption can be display-only for the demo unless P0/P1 are already done.

---

## 9. PAYMENTS (`lib/payments.ts`) — mocked, real interface

```ts
export interface ChargeInput {
  amountDZD: number;
  reference: string;         // sponsorshipId | donationId
  card: { last4: string; holderName: string };
}
export interface ChargeResult { status: "CONFIRMED" | "FAILED"; transactionId: string; }

export interface PaymentProvider {
  charge(input: ChargeInput): Promise<ChargeResult>;
}

// Demo implementation: always succeeds after a short delay.
export class MockEdahabiaProvider implements PaymentProvider {
  async charge(i: ChargeInput): Promise<ChargeResult> {
    await new Promise(r => setTimeout(r, 900));
    return { status: "CONFIRMED", transactionId: "MOCK-" + crypto.randomUUID() };
  }
}

// TODO (roadmap, do NOT implement now): real SATIM / Algerie Poste gateway.
// export class SatimProvider implements PaymentProvider { ... }

export const payments: PaymentProvider = new MockEdahabiaProvider();
```

Route Handler `/api/pay` (or a Server Action): validate input (Zod), call `payments.charge`, then create/confirm the `Sponsorship`/`Donation` and update caisse in a transaction. **Never accept or store a full card number.**

---

## 10. QR CHECK-IN FLOW (end to end — the centerpiece, get it bulletproof)

1. Volunteer (enrolled) opens `/volunteer/checkin/[campaignId]` → `issueCheckInToken` → QR rendered from the opaque token.
2. Org phone at the deployed **HTTPS** URL opens `/org/scanner` → camera decodes → `POST /api/checkin { token }`.
3. Server validates, in one `prisma.$transaction`:
   - token exists, `usedAt == null`, `expiresAt > now`,
   - the scanning org **owns** `token.campaignId`,
   - the volunteer has an `Enrollment` for that campaign (create one as ATTENDED if org prefers walk-ins — configurable, default require enrollment),
   - then: mark `token.usedAt = now`, call `awardAttendance(...)`.
4. Response returns `{ volunteerName, pointsAwarded, newTotal }` for the scanner confirmation card.
5. Volunteer profile reflects new points on next load.

**Security notes (demo-appropriate):** opaque random token, single-use, short TTL, org-ownership check server-side, no PII in the QR. Do not trust anything decoded from the QR beyond the token lookup.

**Failure fallbacks (all required):**
- Manual token paste field on the scanner page → same `/api/checkin`.
- "Mark attended" from the participant list → same `awardAttendance`.
- A seeded demo token you can rely on if the network hiccups.

---

## 11. PRIORITY TIERS (build in this order — < 12h)

**P0 — the two live flows must work end to end (build first, deploy, verify on real phone):**
1. Skeleton + Neon connected + clean Vercel deploy (within hour 1).
2. Prisma schema + `db push` + seed with mock data.
3. Quick-login + role gating.
4. Volunteer: feed, enroll/withdraw/favorite, profile with stats, QR generate.
5. Org: onboarding, dashboard, campaign create + cancel, participants list, **QR scan + manual fallback**, `awardAttendance`.
6. Gamification engine wired to check-in.
7. i18n **infrastructure** working (FR/EN/AR switch + RTL flip), even if not all strings are translated.

**P1 — makes the pitch complete:**
8. Inbox notifications (recommendations + cancellation + points/rank).
9. Sponsor browse + packs + mock checkout → caisse.
10. Individual donations → caisse.
11. Caisse view for org.
12. Leaderboard / top-national view.

**P2 — only if P0+P1 are green:**
13. Full AR/EN translation of all UI + mock content.
14. Rewards redemption logic.
15. No-show handling, waitlist promotion, polish/animations.

**If time is short, cut from the bottom of P2 upward. Never cut a P0 fallback.**

---

## 12. i18n + RTL RULES (do this from the start, not as a retrofit)

- `next-intl` with `[locale]` segment. Locales: `fr` (default), `en`, `ar`. Middleware handles routing + locale detection.
- In `[locale]/layout.tsx`: `<html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>`.
- **Tailwind: logical properties only.** `ps-/pe-/ms-/me-/start-/end-/text-start/text-end`. Any `pl-/pr-/ml-/mr-/left-/right-` is a bug that breaks Arabic.
- Translation keys live in `messages/{fr,en,ar}.json`. Notifications store **keys + params**, not translated text, so the same notification renders correctly in any language.
- Language switcher in the header, persists via the URL locale (and optionally a cookie).
- Numbers/dates: use `next-intl` formatting; keep amounts in DZD.
- Acceptance: switching to Arabic flips the whole layout to RTL and keeps it usable; FR is fully translated (it is default and the demo language).

---

## 13. SEED DATA (`prisma/seed.ts`) — mock, no emoji

Generate realistic Algerian-context mock data. **No emoji anywhere.** Include:
- `SponsorshipPack`: 3 rows (STARTER / PRO / MAX) with DZD prices + `benefitKeys`.
- ~6 organizations across different domains (ecology, sport, education, health, social, culture) with descriptions.
- ~15–20 campaigns spread over statuses and dates, some `needsFunding`, some `sponsorRequested`, varied cities.
- ~12 volunteers with varied `totalPoints`/`eventsCompleted` so the leaderboard looks alive; one "demo volunteer" you log in as on stage, enrolled in an ongoing campaign, with a ready check-in path.
- ~4 sponsor accounts with a `SavedCard` (mock, last4 only) each.
- Some enrollments, favorites, past check-ins, a few donations + confirmed sponsorships so caisses show real totals.
- A handful of notifications for the demo volunteer (a recommendation + a points-awarded).
- One reliable **demo check-in token** for the QR fallback.
- Register seed in `package.json`: `"prisma": { "seed": "tsx prisma/seed.ts" }`.

Use plausible names/places; keep text bilingual-ready but at minimum coherent in FR.

---

## 14. PRE-DEMO QA CHECKLIST (run this before going on stage)

- [ ] Production URL loads; no console errors on key pages.
- [ ] **Warm the Neon DB** right before the demo (Neon scales to zero after ~5 min idle; the first query cold-starts by a second or several). Hit the app once, 30–60s before you present.
- [ ] Camera scan tested **on the actual phone you'll use**, at the venue if possible (permissions + lighting).
- [ ] Manual token fallback confirmed working.
- [ ] Full happy path rehearsed: volunteer login → enroll → show QR; org login → scan → points appear on volunteer profile.
- [ ] Org: create campaign live → shows in feed; cancel → notification lands in volunteer inbox.
- [ ] Sponsor: buy a pack → appears in caisse + org notified.
- [ ] Language switch to AR flips RTL cleanly on every demo page.
- [ ] No emoji slipped into any seed text or UI.
- [ ] Have the seeded demo accounts + demo token written down as a backup.

---

## 15. DEFINITION OF DONE

The prototype is demo-ready when every **P0** acceptance criterion passes on the **deployed Vercel URL** (not just locally), the QR check-in works cross-device with a working manual fallback, the build is green, and the Arabic RTL switch does not break layout. P1 completes the pitch; P2 is polish.
