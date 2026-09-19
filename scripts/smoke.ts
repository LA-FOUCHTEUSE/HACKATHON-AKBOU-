/**
 * Scripted DB smoke test (docs/ARCHITECTURE.md section 38).
 * Calls lib functions directly (no HTTP, no cookies) against the database in DATABASE_URL.
 * It creates its own fixtures and deletes them at the end, so seeded demo data is never modified.
 *
 * Run: npm run smoke
 */
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { checkInEligibility, issueToken, redeemToken } from "../src/lib/checkin";
import { awardAttendance, getLeaderboard, getNationalRank } from "../src/lib/points";
import { cancelCampaign } from "../src/lib/campaigns";
import { getFundingTotals, getOrgCaisse } from "../src/lib/caisse";
import { processDonation, processSponsorship } from "../src/lib/contributions";
import { payments } from "../src/lib/payments";
import { DomainError } from "../src/lib/errors";
import { payRequestSchema } from "../src/lib/validation";
import { getTier } from "../src/lib/tiers";
import type { ErrorCode } from "../src/lib/result";

const prisma = new PrismaClient();
const run = randomBytes(3).toString("hex");
const HOUR = 3_600_000;
let failures = 0;
let passed = 0;

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed++;
    console.log(`  ok    ${name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${name}${detail === undefined ? "" : ` -> ${JSON.stringify(detail)}`}`);
  }
}

async function expectCode(name: string, code: ErrorCode, fn: () => Promise<unknown>) {
  try {
    const value = await fn();
    check(name, false, { expected: code, got: "no error", value });
  } catch (e) {
    check(name, e instanceof DomainError && e.code === code, { expected: code, got: e instanceof DomainError ? e.code : String(e) });
  }
}

const created = {
  userIds: [] as string[],
  volunteerIds: [] as string[],
  campaignIds: [] as string[],
};

async function makeUser(role: "VOLUNTEER" | "ORGANIZATION" | "SPONSOR", label: string, points = 0) {
  const email = `smoke-${run}-${label}@test.tawa3.dz`;
  const user = await prisma.user.create({
    data: {
      role,
      email,
      displayName: `Smoke ${label}`,
      ...(role === "VOLUNTEER"
        ? { volunteer: { create: { fullName: `Smoke Volunteer ${label} ${run}`, totalPoints: points, eventsCompleted: points > 0 ? 1 : 0 } } }
        : role === "ORGANIZATION"
          ? { organization: { create: { name: `Smoke Org ${label} ${run}`, domains: ["SOCIAL"] } } }
          : { sponsor: { create: { companyName: `Smoke Sponsor ${run}` }, } }),
      ...(role === "SPONSOR" ? { savedCards: { create: { holderName: "Smoke Holder", last4: "1234" } } } : {}),
    },
    include: { volunteer: true, organization: true, sponsor: true, savedCards: true },
  });
  created.userIds.push(user.id);
  if (user.volunteer) {
    created.volunteerIds.push(user.volunteer.id);
    if (points > 0) {
      await prisma.pointsTransaction.create({ data: { volunteerId: user.volunteer.id, amount: points, reason: "OPENING_BALANCE" } });
    }
  }
  return user;
}

async function makeCampaign(orgId: string, title: string, extra: Record<string, unknown> = {}) {
  const c = await prisma.campaign.create({
    data: {
      orgId,
      title: `${title} ${run}`,
      description: "Campagne de test automatisé.",
      domain: "SOCIAL",
      startAt: new Date(Date.now() - HOUR),
      endAt: new Date(Date.now() + 24 * HOUR),
      capacity: 10,
      pointsValue: 100,
      status: "ONGOING",
      ...extra,
    },
  });
  created.campaignIds.push(c.id);
  return c;
}

const enroll = (volunteerId: string, campaignId: string, status: "ENROLLED" | "WAITLISTED" | "WITHDRAWN") =>
  prisma.enrollment.create({ data: { volunteerId, campaignId, status } });

async function cleanup() {
  const { userIds, volunteerIds, campaignIds } = created;
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.pointsTransaction.deleteMany({ where: { volunteerId: { in: volunteerIds } } });
  await prisma.checkIn.deleteMany({ where: { OR: [{ volunteerId: { in: volunteerIds } }, { campaignId: { in: campaignIds } }] } });
  await prisma.checkInToken.deleteMany({ where: { OR: [{ volunteerId: { in: volunteerIds } }, { campaignId: { in: campaignIds } }] } });
  await prisma.favorite.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.enrollment.deleteMany({ where: { OR: [{ volunteerId: { in: volunteerIds } }, { campaignId: { in: campaignIds } }] } });
  await prisma.donation.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.sponsorship.deleteMany({ where: { campaignId: { in: campaignIds } } });
  await prisma.savedCard.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.campaign.deleteMany({ where: { id: { in: campaignIds } } });
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.sponsorProfile.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function main() {
  console.log(`Smoke test run ${run}`);

  const orgUser = await makeUser("ORGANIZATION", "org");
  const otherOrgUser = await makeUser("ORGANIZATION", "otherorg");
  const org = orgUser.organization!;
  const otherOrg = otherOrgUser.organization!;
  const v1 = await makeUser("VOLUNTEER", "v1", 290); // 290 + 100 crosses the 300 tier boundary
  const v2 = await makeUser("VOLUNTEER", "v2"); // waitlisted
  const v3 = await makeUser("VOLUNTEER", "v3"); // withdrawn
  const v4 = await makeUser("VOLUNTEER", "v4"); // manual path
  const v5 = await makeUser("VOLUNTEER", "v5"); // concurrent scans
  const sponsorUser = await makeUser("SPONSOR", "sponsor");
  const sponsor = sponsorUser.sponsor!;
  const card = sponsorUser.savedCards[0];

  const campaign = await makeCampaign(org.id, "Check-in");
  for (const v of [v1, v4, v5]) await enroll(v.volunteer!.id, campaign.id, "ENROLLED");
  await enroll(v2.volunteer!.id, campaign.id, "WAITLISTED");
  await enroll(v3.volunteer!.id, campaign.id, "WITHDRAWN");

  console.log("QR token issue and redeem");
  const t1 = await issueToken(v1.volunteer!.id, campaign.id);
  check("token is opaque base64url, 32 chars", /^[A-Za-z0-9_-]{32}$/.test(t1.token), t1.token);
  check("token contains no PII", !t1.token.includes(v1.volunteer!.id) && !t1.token.toLowerCase().includes("smoke"));
  check("token expires in about 2 hours", Math.abs(t1.expiresAt.getTime() - (Date.now() + 2 * HOUR)) < 60_000);
  check("issuing again reuses the unused token", (await issueToken(v1.volunteer!.id, campaign.id)).token === t1.token);
  await expectCode("withdrawn volunteer cannot get a token", "NOT_ENROLLED", () => issueToken(v3.volunteer!.id, campaign.id));

  await expectCode("unknown token", "TOKEN_NOT_FOUND", () => redeemToken(org.id, "does-not-exist-000000"));
  await expectCode("other organization cannot redeem", "CAMPAIGN_NOT_OWNED", () => redeemToken(otherOrg.id, t1.token));
  const expired = await prisma.checkInToken.create({
    data: { token: `expired-${run}-${randomBytes(4).toString("hex")}`, volunteerId: v4.volunteer!.id, campaignId: campaign.id, expiresAt: new Date(Date.now() - HOUR) },
  });
  await expectCode("expired token", "TOKEN_EXPIRED", () => redeemToken(org.id, expired.token));

  const r1 = await redeemToken(org.id, t1.token);
  check("redeem awards the campaign points", r1.pointsAwarded === 100 && r1.newTotal === 390, r1);
  check("crossing 300 points is a tier increase", r1.rankUp && r1.tierKey === "tier.contributor" && getTier(390).key === r1.tierKey, r1);
  const p1 = await prisma.volunteerProfile.findUniqueOrThrow({ where: { id: v1.volunteer!.id } });
  check("profile totals updated", p1.totalPoints === 390 && p1.eventsCompleted === 2, p1);
  check("enrollment is ATTENDED", (await prisma.enrollment.findUniqueOrThrow({ where: { volunteerId_campaignId: { volunteerId: p1.id, campaignId: campaign.id } } })).status === "ATTENDED");
  check("ledger row written", (await prisma.pointsTransaction.count({ where: { volunteerId: p1.id, reason: `ATTENDED:${campaign.id}`, amount: 100 } })) === 1);
  check("token marked used", (await prisma.checkInToken.findUniqueOrThrow({ where: { token: t1.token } })).usedAt !== null);
  const notes = await prisma.notification.findMany({ where: { userId: v1.id } });
  check("POINTS_AWARDED and RANK_UP notifications", notes.some((n) => n.type === "POINTS_AWARDED") && notes.some((n) => n.type === "RANK_UP"));
  check("notifications store keys and params only", notes.every((n) => n.titleKey.startsWith("notifications.") && n.bodyKey.startsWith("notifications.")));

  await expectCode("token cannot be used twice", "TOKEN_USED", () => redeemToken(org.id, t1.token));
  await expectCode("attended volunteer gets no new token", "ALREADY_ATTENDED", () => issueToken(v1.volunteer!.id, campaign.id));
  const second = await prisma.checkInToken.create({
    data: { token: `second-${run}-${randomBytes(4).toString("hex")}`, volunteerId: p1.id, campaignId: campaign.id, expiresAt: new Date(Date.now() + HOUR) },
  });
  const again = await redeemToken(org.id, second.token);
  check("second token for an attended volunteer is idempotent", again.alreadyAttended && again.pointsAwarded === 0 && again.newTotal === 390, again);
  check("no duplicate CheckIn or ledger row", (await prisma.checkIn.count({ where: { volunteerId: p1.id, campaignId: campaign.id } })) === 1 && (await prisma.pointsTransaction.count({ where: { volunteerId: p1.id, reason: `ATTENDED:${campaign.id}` } })) === 1);

  console.log("Waitlist eligibility, manual path, concurrency");
  const t2 = await issueToken(v2.volunteer!.id, campaign.id);
  const r2 = await redeemToken(org.id, t2.token);
  check("waitlisted volunteer can check in", !r2.alreadyAttended && r2.pointsAwarded === 100 && r2.wasWaitlisted, r2);

  const m1 = await awardAttendance(v4.volunteer!.id, campaign);
  check("manual attendance uses the same engine", !m1.alreadyAttended && m1.pointsAwarded === 100 && m1.newTotal === 100, m1);
  const m2 = await awardAttendance(v4.volunteer!.id, campaign);
  check("manual attendance is idempotent", m2.alreadyAttended && m2.pointsAwarded === 0, m2);
  await expectCode("WITHDRAWN is not eligible", "NOT_ENROLLED", async () => checkInEligibility("WITHDRAWN"));
  check("WAITLISTED, ENROLLED and NO_SHOW are eligible", (["WAITLISTED", "ENROLLED", "NO_SHOW"] as const).every((s) => checkInEligibility(s) === "eligible"));

  const t5 = await issueToken(v5.volunteer!.id, campaign.id);
  const [a, b] = await Promise.allSettled([redeemToken(org.id, t5.token), redeemToken(org.id, t5.token)]);
  const fulfilled = [a, b].filter((r) => r.status === "fulfilled" && !r.value.alreadyAttended);
  check("concurrent scans of one token award exactly once", fulfilled.length === 1, [a.status, b.status]);
  check("concurrent scans leave one ledger row", (await prisma.pointsTransaction.count({ where: { volunteerId: v5.volunteer!.id, reason: `ATTENDED:${campaign.id}` } })) === 1);

  console.log("Cancellation");
  const cancelled = await makeCampaign(org.id, "Annulation", { status: "PUBLISHED" });
  await enroll(v1.volunteer!.id, cancelled.id, "ENROLLED");
  await enroll(v2.volunteer!.id, cancelled.id, "WAITLISTED");
  await enroll(v3.volunteer!.id, cancelled.id, "WITHDRAWN");
  check("another organization cannot cancel", (await cancelCampaign({ id: otherOrg.id, name: "x" }, cancelled.id)) === null);
  check("cancelling notifies enrolled and waitlisted volunteers", (await cancelCampaign({ id: org.id, name: org.name }, cancelled.id)) === 2);
  const cancelNotes = await prisma.notification.findMany({ where: { type: "CAMPAIGN_CANCELLED", campaignId: cancelled.id } });
  check("CAMPAIGN_CANCELLED rows for the right users", cancelNotes.length === 2 && cancelNotes.every((n) => [v1.id, v2.id].includes(n.userId)));
  check("cancelling twice sends nothing more", (await cancelCampaign({ id: org.id, name: org.name }, cancelled.id)) === 0);
  await expectCode("cancelled campaign refuses sponsorship", "CAMPAIGN_CLOSED", () =>
    processSponsorship({ id: sponsor.id, companyName: sponsor.companyName }, sponsorUser.id, { campaignId: cancelled.id, tier: "PRO", cardId: card.id }),
  );

  console.log("Payments and caisse");
  const funded = await makeCampaign(org.id, "Financement", { needsFunding: true, fundingGoal: 100_000, sponsorRequested: true });
  const pack = await prisma.sponsorshipPack.findUniqueOrThrow({ where: { tier: "PRO" } });

  const donation = await processDonation(null, { campaignId: funded.id, donorName: "Donateur Test", amountDZD: 5000 });
  check("anonymous donation confirmed by the mock provider", donation.status === "CONFIRMED" && donation.transactionId.startsWith("MOCK-"), donation);
  const donationRow = await prisma.donation.findUniqueOrThrow({ where: { id: donation.reference } });
  check("donation row CONFIRMED with mock method", donationRow.status === "CONFIRMED" && donationRow.method === "EDAHABIA_MOCK" && donationRow.amountDZD === 5000);

  const sponsorship = await processSponsorship({ id: sponsor.id, companyName: sponsor.companyName }, sponsorUser.id, { campaignId: funded.id, tier: "PRO", cardId: card.id });
  check("sponsorship amount comes from the pack price", sponsorship.amountDZD === pack.priceDZD && sponsorship.status === "CONFIRMED", sponsorship);
  await expectCode("card of another user is refused", "CARD_NOT_FOUND", () =>
    processSponsorship({ id: sponsor.id, companyName: sponsor.companyName }, orgUser.id, { campaignId: funded.id, tier: "PRO", cardId: card.id }),
  );

  const orgNotes = await prisma.notification.findMany({ where: { userId: orgUser.id, campaignId: funded.id } });
  const sponsorNote = orgNotes.find((n) => n.type === "SPONSOR_CONFIRMED");
  check("organization notified of the sponsorship", !!sponsorNote && (sponsorNote.params as Record<string, unknown>).tierKey === "packs.PRO.name" && (sponsorNote.params as Record<string, unknown>).amount === pack.priceDZD, sponsorNote?.params);
  check("organization notified of the donation", orgNotes.some((n) => n.type === "DONATION_RECEIVED" && (n.params as Record<string, unknown>).amount === 5000));

  const totals = (await getFundingTotals([funded.id])).get(funded.id);
  check("caisse totals add donations and sponsorships", totals?.raised === 5000 + pack.priceDZD && totals.donations === 5000 && totals.sponsorships === pack.priceDZD, totals);
  const caisse = await getOrgCaisse(org.id);
  const row = caisse.campaigns.find((c) => c.id === funded.id);
  check("org caisse lists both contributions with a percentage", row?.contributions.length === 2 && row.percent === Math.round(((5000 + pack.priceDZD) / 100_000) * 100), row && { n: row.contributions.length, percent: row.percent });

  // A failing provider must leave FAILED rows that never count towards the caisse.
  const realCharge = payments.charge.bind(payments);
  try {
    payments.charge = async () => ({ status: "FAILED", transactionId: "TEST-FAILED" });
    await expectCode("declined payment", "PAYMENT_FAILED", () => processDonation(null, { campaignId: funded.id, donorName: "Refusé", amountDZD: 2000 }));
    payments.charge = async () => {
      throw new Error("provider down");
    };
    let threw = false;
    try {
      await processDonation(null, { campaignId: funded.id, donorName: "Panne", amountDZD: 3000 });
    } catch {
      threw = true;
    }
    check("provider crash propagates", threw);
  } finally {
    payments.charge = realCharge;
  }
  check("failed payments are stored as FAILED", (await prisma.donation.count({ where: { campaignId: funded.id, status: "FAILED" } })) === 2 && (await prisma.donation.count({ where: { campaignId: funded.id, status: "PENDING" } })) === 0);
  check("failed payments do not change the caisse", (await getFundingTotals([funded.id])).get(funded.id)?.raised === 5000 + pack.priceDZD);

  console.log("Card data safety and ranking");
  const parsed = payRequestSchema.parse({ kind: "DONATION", campaignId: funded.id, donorName: "X Y", amountDZD: "5000", cardNumber: "4111111111111111", cvv: "123" });
  check("card number fields are stripped by validation", !("cardNumber" in parsed) && !("cvv" in parsed), parsed);
  const cards = await prisma.savedCard.findMany({ select: { last4: true } });
  check("every saved card stores exactly four digits", cards.every((c) => /^\d{4}$/.test(c.last4)));

  const volunteers = await prisma.volunteerProfile.findMany({ select: { id: true, totalPoints: true } });
  const sums = await prisma.pointsTransaction.groupBy({ by: ["volunteerId"], _sum: { amount: true } });
  const sumBy = new Map(sums.map((s) => [s.volunteerId, s._sum.amount ?? 0]));
  check("ledger equals totalPoints for every volunteer", volunteers.every((v) => (sumBy.get(v.id) ?? 0) === v.totalPoints));
  const board = await getLeaderboard(1000);
  let consistent = board.length === volunteers.length;
  for (const entry of board) {
    const profile = await prisma.volunteerProfile.findUniqueOrThrow({ where: { id: entry.id } });
    if ((await getNationalRank(profile)) !== entry.rank) consistent = false;
  }
  check("leaderboard positions equal getNationalRank for everyone", consistent);
}

main()
  .catch((e) => {
    failures++;
    console.error("Smoke test crashed:", e);
  })
  .finally(async () => {
    try {
      await cleanup();
      console.log("Fixtures removed");
    } catch (e) {
      failures++;
      console.error("Cleanup failed, leftover rows have the prefix smoke-" + run, e);
    }
    await prisma.$disconnect();
    console.log(failures === 0 ? `smoke passed (${passed} checks)` : `smoke FAILED (${failures} failed, ${passed} passed)`);
    process.exit(failures === 0 ? 0 : 1);
  });
