import "server-only";
import type { VolunteerProfile } from "@prisma/client";
import { prisma } from "./prisma";
import { getNationalRank } from "./points";
import { getTierProgress } from "./tiers";
import { getCampaignsByIds } from "./campaigns";

export async function getVolunteerProfileStats(profile: VolunteerProfile) {
  const now = new Date();
  const [rank, total, history, checkIns, upcomingEnrollments, favorites] = await Promise.all([
    getNationalRank(profile),
    prisma.volunteerProfile.count(),
    prisma.pointsTransaction.findMany({
      where: { volunteerId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, amount: true, reason: true, createdAt: true },
    }),
    prisma.checkIn.findMany({
      where: { volunteerId: profile.id },
      orderBy: { checkedInAt: "desc" },
      select: {
        id: true,
        pointsAwarded: true,
        checkedInAt: true,
        campaign: { select: { id: true, title: true, domain: true, city: true } },
      },
    }),
    prisma.enrollment.findMany({
      where: {
        volunteerId: profile.id,
        status: { in: ["ENROLLED", "WAITLISTED"] },
        campaign: { endAt: { gte: now }, status: { in: ["PUBLISHED", "ONGOING"] } },
      },
      select: { campaignId: true },
    }),
    prisma.favorite.findMany({ where: { volunteerId: profile.id }, select: { campaignId: true } }),
  ]);

  // Resolve campaign titles referenced by the ledger ("ATTENDED:<campaignId>").
  const ledgerCampaignIds = history
    .map((h) => (h.reason.startsWith("ATTENDED:") ? h.reason.slice("ATTENDED:".length) : null))
    .filter((id): id is string => id !== null);
  const ledgerCampaigns = await prisma.campaign.findMany({
    where: { id: { in: ledgerCampaignIds } },
    select: { id: true, title: true },
  });
  const titleOf = new Map(ledgerCampaigns.map((c) => [c.id, c.title]));

  return {
    rank,
    totalVolunteers: total,
    progress: getTierProgress(profile.totalPoints),
    history: history.map((h) => {
      const campaignId = h.reason.startsWith("ATTENDED:") ? h.reason.slice("ATTENDED:".length) : null;
      return { ...h, campaignTitle: campaignId ? (titleOf.get(campaignId) ?? null) : null };
    }),
    attended: checkIns,
    upcoming: await getCampaignsByIds(upcomingEnrollments.map((e) => e.campaignId), profile.id),
    favorites: await getCampaignsByIds(favorites.map((f) => f.campaignId), profile.id),
  };
}

export function findVolunteersByName(name: string) {
  return prisma.volunteerProfile.findMany({
    where: { fullName: { equals: name.trim(), mode: "insensitive" } },
    take: 5,
    select: { id: true, fullName: true, city: true, userId: true },
  });
}
