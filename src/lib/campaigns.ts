import "server-only";
import type { ActivityDomain, CampaignStatus, EnrollmentStatus, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { FEED_STATUSES, SEAT_STATUSES } from "./constants";
import { fundingOf, getFundingTotals } from "./caisse";

/** Serializable campaign shape passed to cards (server and client components). */
export interface CampaignCardData {
  id: string;
  title: string;
  description: string;
  domain: ActivityDomain;
  city: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  status: CampaignStatus;
  capacity: number;
  occupied: number;
  remaining: number | null;
  pointsValue: number;
  needsFunding: boolean;
  fundingGoal: number | null;
  sponsorRequested: boolean;
  raised: number;
  orgName: string;
  orgVerified: boolean;
  myStatus: EnrollmentStatus | null;
  isFavorite: boolean;
}

export function remainingSeats(capacity: number, occupied: number): number | null {
  return capacity === 0 ? null : Math.max(0, capacity - occupied);
}

function cardSelect(volunteerId: string | null) {
  return {
    id: true,
    title: true,
    description: true,
    domain: true,
    city: true,
    location: true,
    startAt: true,
    endAt: true,
    status: true,
    capacity: true,
    pointsValue: true,
    needsFunding: true,
    fundingGoal: true,
    sponsorRequested: true,
    org: { select: { name: true, verified: true } },
    _count: { select: { enrollments: { where: { status: { in: [...SEAT_STATUSES] } } } } },
    enrollments: volunteerId
      ? { where: { volunteerId }, select: { status: true } }
      : { where: { id: "__none__" }, select: { status: true } },
    favorites: volunteerId
      ? { where: { volunteerId }, select: { id: true } }
      : { where: { id: "__none__" }, select: { id: true } },
  } satisfies Prisma.CampaignSelect;
}

type CardRow = Prisma.CampaignGetPayload<{ select: ReturnType<typeof cardSelect> }>;

async function toCards(rows: CardRow[]): Promise<CampaignCardData[]> {
  const totals = await getFundingTotals(rows.map((r) => r.id));
  return rows.map((r) => {
    const occupied = r._count.enrollments;
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      domain: r.domain,
      city: r.city,
      location: r.location,
      startAt: r.startAt,
      endAt: r.endAt,
      status: r.status,
      capacity: r.capacity,
      occupied,
      remaining: remainingSeats(r.capacity, occupied),
      pointsValue: r.pointsValue,
      needsFunding: r.needsFunding,
      fundingGoal: r.fundingGoal,
      sponsorRequested: r.sponsorRequested,
      raised: fundingOf(totals, r.id).raised,
      orgName: r.org.name,
      orgVerified: r.org.verified,
      myStatus: r.enrollments[0]?.status ?? null,
      isFavorite: r.favorites.length > 0,
    };
  });
}

/** Volunteer and public feed: PUBLISHED or ONGOING, newest first (spec 7.1.A). */
export async function getFeed(volunteerId: string | null): Promise<CampaignCardData[]> {
  const rows = await prisma.campaign.findMany({
    where: { status: { in: [...FEED_STATUSES] } },
    orderBy: { createdAt: "desc" },
    select: cardSelect(volunteerId),
  });
  return toCards(rows);
}

export async function getCampaignCard(id: string, volunteerId: string | null): Promise<CampaignCardData | null> {
  const row = await prisma.campaign.findUnique({ where: { id }, select: cardSelect(volunteerId) });
  if (!row) return null;
  return (await toCards([row]))[0];
}

export async function getCampaignsByIds(ids: string[], volunteerId: string | null): Promise<CampaignCardData[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.campaign.findMany({
    where: { id: { in: ids } },
    orderBy: { startAt: "asc" },
    select: cardSelect(volunteerId),
  });
  return toCards(rows);
}

/** Sponsor browse: campaigns that asked for a sponsor or need funding (spec 7.3.A). */
export async function getSponsorableCampaigns(): Promise<CampaignCardData[]> {
  const rows = await prisma.campaign.findMany({
    where: {
      status: { in: [...FEED_STATUSES] },
      OR: [{ sponsorRequested: true }, { needsFunding: true }],
    },
    orderBy: { startAt: "asc" },
    select: cardSelect(null),
  });
  return toCards(rows);
}

export type CampaignPhase = "ongoing" | "upcoming" | "history";

/** Dashboard grouping computed from status and dates; stored status is never changed here. */
export function campaignPhase(c: { status: CampaignStatus; startAt: Date; endAt: Date }, now = new Date()): CampaignPhase {
  if (c.status === "COMPLETED" || c.status === "CANCELLED" || c.endAt < now) return "history";
  if (c.status === "ONGOING" || (c.status === "PUBLISHED" && c.startAt <= now)) return "ongoing";
  return "upcoming";
}

export async function getOrgCampaigns(orgId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: { orgId },
    orderBy: { startAt: "desc" },
    select: {
      id: true,
      title: true,
      domain: true,
      city: true,
      startAt: true,
      endAt: true,
      status: true,
      capacity: true,
      pointsValue: true,
      needsFunding: true,
      fundingGoal: true,
      _count: { select: { enrollments: { where: { status: { in: [...SEAT_STATUSES] } } } } },
    },
  });
  const now = new Date();
  return campaigns.map((c) => ({
    ...c,
    participants: c._count.enrollments,
    remaining: remainingSeats(c.capacity, c._count.enrollments),
    phase: campaignPhase(c, now),
  }));
}

export async function getOrgDashboard(orgId: string) {
  const [campaigns, engaged] = await Promise.all([
    getOrgCampaigns(orgId),
    prisma.enrollment.findMany({
      where: { campaign: { orgId }, status: { in: [...SEAT_STATUSES] } },
      distinct: ["volunteerId"],
      select: { volunteerId: true },
    }),
  ]);
  const totals = await getFundingTotals(campaigns.map((c) => c.id));
  const withFunding = campaigns.map((c) => ({ ...c, raised: fundingOf(totals, c.id).raised }));
  return {
    ongoing: withFunding.filter((c) => c.phase === "ongoing"),
    upcoming: withFunding.filter((c) => c.phase === "upcoming").reverse(),
    history: withFunding.filter((c) => c.phase === "history"),
    stats: {
      campaignsRun: campaigns.filter((c) => c.status !== "DRAFT").length,
      volunteersEngaged: engaged.length,
      totalRaised: withFunding.reduce((sum, c) => sum + c.raised, 0),
    },
  };
}

/** Participants of a campaign owned by `orgId`, or null when not found / not owned. */
export async function getParticipants(campaignId: string, orgId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId },
    select: { id: true, title: true, status: true, capacity: true, pointsValue: true, startAt: true, endAt: true },
  });
  if (!campaign) return null;
  const [enrollments, checkIns] = await Promise.all([
    prisma.enrollment.findMany({
      where: { campaignId },
      orderBy: { enrolledAt: "asc" },
      select: {
        id: true,
        status: true,
        enrolledAt: true,
        volunteer: { select: { id: true, fullName: true, city: true } },
      },
    }),
    prisma.checkIn.findMany({ where: { campaignId }, select: { volunteerId: true, checkedInAt: true } }),
  ]);
  const checkedInAt = new Map(checkIns.map((c) => [c.volunteerId, c.checkedInAt]));
  const rows = enrollments.map((e) => ({ ...e, checkedInAt: checkedInAt.get(e.volunteer.id) ?? null }));
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  return { campaign, rows, counts };
}
