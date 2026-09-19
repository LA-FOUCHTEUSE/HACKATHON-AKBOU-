import "server-only";
import type { Campaign, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { notify } from "./notifications";
import { getTier, type TierKey } from "./tiers";
import { isUniqueViolation } from "./errors";
import { RANKING_ORDER, nationalRank, type RankKey } from "./ranking";
import { LEADERBOARD_SIZE } from "./constants";

export type AttendanceCampaign = Pick<Campaign, "id" | "title" | "pointsValue">;

export interface AttendanceResult {
  alreadyAttended: boolean;
  volunteerName: string;
  campaignTitle: string;
  pointsAwarded: number;
  newTotal: number;
  tierKey: TierKey;
  rankUp: boolean;
  wasWaitlisted: boolean;
}

const TX_OPTIONS = { maxWait: 10_000, timeout: 15_000 } as const;

async function alreadyAttendedResult(
  db: Prisma.TransactionClient,
  volunteerId: string,
  campaign: AttendanceCampaign,
): Promise<AttendanceResult> {
  const profile = await db.volunteerProfile.findUniqueOrThrow({
    where: { id: volunteerId },
    select: { fullName: true, totalPoints: true },
  });
  return {
    alreadyAttended: true,
    volunteerName: profile.fullName,
    campaignTitle: campaign.title,
    pointsAwarded: 0,
    newTotal: profile.totalPoints,
    tierKey: getTier(profile.totalPoints).key,
    rankUp: false,
    wasWaitlisted: false,
  };
}

async function run(
  tx: Prisma.TransactionClient,
  volunteerId: string,
  campaign: AttendanceCampaign,
): Promise<AttendanceResult> {
  const key = { volunteerId_campaignId: { volunteerId, campaignId: campaign.id } };

  const existing = await tx.checkIn.findUnique({ where: key, select: { id: true } });
  if (existing) {
    await tx.enrollment.updateMany({
      where: { volunteerId, campaignId: campaign.id, status: { not: "ATTENDED" } },
      data: { status: "ATTENDED" },
    });
    return alreadyAttendedResult(tx, volunteerId, campaign);
  }

  const before = await tx.volunteerProfile.findUniqueOrThrow({
    where: { id: volunteerId },
    select: { totalPoints: true, fullName: true, userId: true },
  });
  const enrollmentBefore = await tx.enrollment.findUnique({ where: key, select: { status: true } });
  const points = campaign.pointsValue;

  await tx.checkIn.create({
    data: { volunteerId, campaignId: campaign.id, pointsAwarded: points },
  });
  await tx.pointsTransaction.create({
    data: { volunteerId, amount: points, reason: `ATTENDED:${campaign.id}` },
  });
  const after = await tx.volunteerProfile.update({
    where: { id: volunteerId },
    data: { totalPoints: { increment: points }, eventsCompleted: { increment: 1 } },
    select: { totalPoints: true },
  });
  await tx.enrollment.upsert({
    where: key,
    create: { volunteerId, campaignId: campaign.id, status: "ATTENDED" },
    update: { status: "ATTENDED" },
  });

  await notify(
    tx,
    before.userId,
    "POINTS_AWARDED",
    { campaignTitle: campaign.title, points, total: after.totalPoints },
    campaign.id,
  );

  const oldTier = getTier(before.totalPoints);
  const newTier = getTier(after.totalPoints);
  const rankUp = newTier.min > oldTier.min;
  if (rankUp) {
    await notify(tx, before.userId, "RANK_UP", { tierKey: newTier.key }, campaign.id);
  }

  return {
    alreadyAttended: false,
    volunteerName: before.fullName,
    campaignTitle: campaign.title,
    pointsAwarded: points,
    newTotal: after.totalPoints,
    tierKey: newTier.key,
    rankUp,
    wasWaitlisted: enrollmentBefore?.status === "WAITLISTED",
  };
}

/**
 * Single source of truth for attendance and points (spec section 8).
 * Used by QR scan, manual token entry and manual "mark attended".
 * With `db`, runs inside the caller's transaction; otherwise opens its own.
 * Idempotent: a second call for the same volunteer and campaign awards nothing.
 */
export async function awardAttendance(
  volunteerId: string,
  campaign: AttendanceCampaign,
  db?: Prisma.TransactionClient,
): Promise<AttendanceResult> {
  if (db) return run(db, volunteerId, campaign);
  try {
    return await prisma.$transaction((tx) => run(tx, volunteerId, campaign), TX_OPTIONS);
  } catch (e) {
    // Concurrent duplicate hit the CheckIn unique constraint: the other call won.
    if (isUniqueViolation(e)) return alreadyAttendedResult(prisma, volunteerId, campaign);
    throw e;
  }
}

export { alreadyAttendedResult, TX_OPTIONS };

export function getNationalRank(profile: RankKey): Promise<number> {
  return nationalRank(prisma, profile);
}

export async function getLeaderboard(limit = LEADERBOARD_SIZE) {
  const rows = await prisma.volunteerProfile.findMany({
    orderBy: [...RANKING_ORDER],
    take: limit,
    select: { id: true, fullName: true, city: true, totalPoints: true, eventsCompleted: true },
  });
  return rows.map((row, index) => ({ ...row, rank: index + 1, tierKey: getTier(row.totalPoints).key }));
}
