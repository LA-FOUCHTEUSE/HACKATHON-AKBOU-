import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { getCampaignCard } from "@/lib/campaigns";
import { ENROLLABLE_STATUSES } from "@/lib/constants";
import { DomainBadge } from "@/components/campaigns/DomainBadge";
import { FundingProgress } from "@/components/campaigns/FundingProgress";
import { CheckoutForm } from "@/components/sponsor/CheckoutForm";
import { PackCard } from "@/components/sponsor/PackCard";

export const dynamic = "force-dynamic";

const TIER_ORDER = { STARTER: 0, PRO: 1, MAX: 2 } as const;

export default async function SponsorCheckoutPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const { user } = await requireRole("SPONSOR");
  const t = await getTranslations("sponsor");

  const campaign = await getCampaignCard(campaignId, null);
  if (!campaign || !(ENROLLABLE_STATUSES as readonly string[]).includes(campaign.status)) notFound();

  const [packs, cards] = await Promise.all([
    prisma.sponsorshipPack.findMany({ select: { tier: true, priceDZD: true, benefitKeys: true } }),
    prisma.savedCard.findMany({
      where: { userId: user.id },
      orderBy: { id: "asc" },
      select: { id: true, holderName: true, last4: true, brand: true },
    }),
  ]);
  packs.sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">{t("checkoutTitle")}</p>
        <h1 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]">{campaign.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <DomainBadge domain={campaign.domain} />
          <span>{campaign.orgName}</span>
          {campaign.city ? <span>- {campaign.city}</span> : null}
        </div>
        <FundingProgress raised={campaign.raised} goal={campaign.fundingGoal} />
      </header>

      <div data-stagger="" className="grid gap-4 md:grid-cols-3">
        {packs.map((pack) => (
          <PackCard key={pack.tier} pack={pack} />
        ))}
      </div>

      <CheckoutForm campaignId={campaign.id} packs={packs} cards={cards} />
    </div>
  );
}
