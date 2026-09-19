import { PrismaClient } from "@prisma/client";
import { nationalRank } from "../src/lib/ranking";
import { getTier } from "../src/lib/tiers";
import { DEMO_CHECKIN_TOKEN, DEMO_EMAILS } from "./seed-data";

// Read-only checks against the seeded database. Uses the app's own ranking and tier code.
const prisma = new PrismaClient();
const failures: string[] = [];
const check = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

async function main() {
  // 1. Ledger invariant: sum(PointsTransaction) == totalPoints for every volunteer.
  const volunteers = await prisma.volunteerProfile.findMany({
    select: { id: true, fullName: true, totalPoints: true, eventsCompleted: true },
  });
  const sums = await prisma.pointsTransaction.groupBy({ by: ["volunteerId"], _sum: { amount: true } });
  const sumBy = new Map(sums.map((s) => [s.volunteerId, s._sum.amount ?? 0]));
  for (const v of volunteers) {
    check((sumBy.get(v.id) ?? 0) === v.totalPoints, `ledger mismatch for ${v.fullName}`);
  }

  // 2. Unique (totalPoints, eventsCompleted) pairs, so ranks do not depend on the id tie-breaker.
  const pairs = new Set(volunteers.map((v) => `${v.totalPoints}:${v.eventsCompleted}`));
  check(pairs.size === volunteers.length, "two volunteers share (totalPoints, eventsCompleted)");

  // 3. Demo volunteer, demo campaign and demo token.
  const demoUser = await prisma.user.findUniqueOrThrow({
    where: { email: DEMO_EMAILS.volunteer },
    include: { volunteer: true },
  });
  const demo = demoUser.volunteer!;
  const token = await prisma.checkInToken.findUnique({ where: { token: DEMO_CHECKIN_TOKEN }, include: { campaign: true } });
  check(!!token, "demo token missing");
  check(!!token && token.usedAt === null, "demo token already used");
  check(!!token && token.expiresAt > new Date(), "demo token expired");
  check(token?.volunteerId === demo.id, "demo token does not belong to the demo volunteer");
  const campaign = token!.campaign;
  check(campaign.status === "ONGOING", "demo campaign is not ONGOING");
  const enrollment = await prisma.enrollment.findUnique({
    where: { volunteerId_campaignId: { volunteerId: demo.id, campaignId: campaign.id } },
  });
  check(enrollment?.status === "ENROLLED", "demo volunteer is not ENROLLED in the demo campaign");
  const demoOrg = await prisma.user.findUniqueOrThrow({ where: { email: DEMO_EMAILS.organization }, include: { organization: true } });
  check(campaign.orgId === demoOrg.organization!.id, "demo campaign is not owned by the demo organization");

  // 4. Rank and tier before, and simulated after one check-in (no writes).
  const rankBefore = await nationalRank(prisma, demo);
  const after = { id: demo.id, totalPoints: demo.totalPoints + campaign.pointsValue, eventsCompleted: demo.eventsCompleted + 1 };
  const rankAfter = await nationalRank(prisma, after);
  const tierBefore = getTier(demo.totalPoints);
  const tierAfter = getTier(after.totalPoints);
  check(tierAfter.min > tierBefore.min, "demo check-in does not cross a tier (no RANK_UP moment)");

  // 5. Full campaign for the waitlist demo.
  const full = await prisma.campaign.findFirst({ where: { capacity: { gt: 0 }, title: "Formation aux premiers secours" } });
  if (full) {
    const occupied = await prisma.enrollment.count({ where: { campaignId: full.id, status: { in: ["ENROLLED", "ATTENDED"] } } });
    check(occupied >= full.capacity, "waitlist demo campaign is not full");
  }

  console.log("Demo volunteer:", demo.fullName);
  console.log("Demo campaign:", campaign.title, `(${campaign.id}, +${campaign.pointsValue} points)`);
  console.log(`Before check-in: ${demo.totalPoints} points, ${demo.eventsCompleted} events, ${tierBefore.key}, national rank ${rankBefore} of ${volunteers.length}`);
  console.log(`After check-in:  ${after.totalPoints} points, ${after.eventsCompleted} events, ${tierAfter.key}, national rank ${rankAfter} of ${volunteers.length}`);

  if (failures.length > 0) {
    console.error("seed:verify FAILED");
    for (const f of failures) console.error(" -", f);
    process.exitCode = 1;
  } else {
    console.log("seed:verify passed");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
