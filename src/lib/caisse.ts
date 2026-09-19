import "server-only";
import { prisma } from "./prisma";

export interface FundingTotal {
  raised: number;
  donations: number;
  sponsorships: number;
}

const EMPTY: FundingTotal = { raised: 0, donations: 0, sponsorships: 0 };

/** Single source for "raised" amounts: CONFIRMED donations + CONFIRMED sponsorships. */
export async function getFundingTotals(campaignIds: string[]): Promise<Map<string, FundingTotal>> {
  const totals = new Map<string, FundingTotal>();
  if (campaignIds.length === 0) return totals;
  const where = { campaignId: { in: campaignIds }, status: "CONFIRMED" as const };
  const [donations, sponsorships] = await Promise.all([
    prisma.donation.groupBy({ by: ["campaignId"], where, _sum: { amountDZD: true } }),
    prisma.sponsorship.groupBy({ by: ["campaignId"], where, _sum: { amountDZD: true } }),
  ]);
  for (const d of donations) {
    const t = totals.get(d.campaignId) ?? { ...EMPTY };
    t.donations = d._sum.amountDZD ?? 0;
    totals.set(d.campaignId, t);
  }
  for (const s of sponsorships) {
    const t = totals.get(s.campaignId) ?? { ...EMPTY };
    t.sponsorships = s._sum.amountDZD ?? 0;
    totals.set(s.campaignId, t);
  }
  for (const t of totals.values()) t.raised = t.donations + t.sponsorships;
  return totals;
}

export function fundingOf(totals: Map<string, FundingTotal>, id: string): FundingTotal {
  return totals.get(id) ?? EMPTY;
}

export function fundingPercent(raised: number, goal: number | null): number | null {
  return goal ? Math.round((raised / goal) * 100) : null;
}

export interface Contribution {
  id: string;
  type: "DONATION" | "SPONSORSHIP";
  contributorName: string;
  amountDZD: number;
  tier: string | null;
  createdAt: Date;
}

export async function getOrgCaisse(orgId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: {
      orgId,
      OR: [
        { needsFunding: true },
        { donations: { some: { status: "CONFIRMED" } } },
        { sponsorships: { some: { status: "CONFIRMED" } } },
      ],
    },
    orderBy: { startAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      fundingGoal: true,
      donations: {
        where: { status: "CONFIRMED" },
        select: { id: true, donorName: true, amountDZD: true, createdAt: true },
      },
      sponsorships: {
        where: { status: "CONFIRMED" },
        select: { id: true, amountDZD: true, tier: true, createdAt: true, sponsor: { select: { companyName: true } } },
      },
    },
  });

  const rows = campaigns.map((c) => {
    const contributions: Contribution[] = [
      ...c.donations.map((d) => ({
        id: d.id,
        type: "DONATION" as const,
        contributorName: d.donorName,
        amountDZD: d.amountDZD,
        tier: null,
        createdAt: d.createdAt,
      })),
      ...c.sponsorships.map((s) => ({
        id: s.id,
        type: "SPONSORSHIP" as const,
        contributorName: s.sponsor.companyName,
        amountDZD: s.amountDZD,
        tier: s.tier,
        createdAt: s.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const raised = contributions.reduce((sum, x) => sum + x.amountDZD, 0);
    return {
      id: c.id,
      title: c.title,
      status: c.status,
      fundingGoal: c.fundingGoal,
      raised,
      percent: fundingPercent(raised, c.fundingGoal),
      contributions,
    };
  });

  return { campaigns: rows, total: rows.reduce((sum, r) => sum + r.raised, 0) };
}
