import { getTranslations } from "next-intl/server";
import { HandCoins } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { getSponsorableCampaigns } from "@/lib/campaigns";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { PackCard } from "@/components/sponsor/PackCard";

export const dynamic = "force-dynamic";

const TIER_ORDER = { STARTER: 0, PRO: 1, MAX: 2 } as const;

export default async function SponsorBrowsePage() {
  await requireRole("SPONSOR");
  const t = await getTranslations("sponsor");
  const [campaigns, packs] = await Promise.all([
    getSponsorableCampaigns(),
    prisma.sponsorshipPack.findMany({ select: { tier: true, priceDZD: true, benefitKeys: true } }),
  ]);
  packs.sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]">{t("browseTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("browseSubtitle")}</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t("packsTitle")}</h2>
        <div data-stagger="" className="grid gap-4 md:grid-cols-3">
          {packs.map((pack) => (
            <PackCard key={pack.tier} pack={pack} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {campaigns.length === 0 ? (
          <p className="text-muted-foreground">{t("noCampaigns")}</p>
        ) : (
          <div data-stagger="" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                footer={
                  <Button asChild size="sm">
                    <Link href={`/sponsor/checkout/${c.id}`}>
                      <HandCoins className="size-4" />
                      {t("sponsor")}
                    </Link>
                  </Button>
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
