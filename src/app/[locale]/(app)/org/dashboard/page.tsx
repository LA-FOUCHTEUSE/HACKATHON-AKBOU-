import { getFormatter, getTranslations } from "next-intl/server";
import { BadgeCheck, Plus, ScanLine } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/session";
import { getOrgDashboard } from "@/lib/campaigns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DomainBadge } from "@/components/campaigns/DomainBadge";
import { OrgCampaignRow } from "@/components/org/OrgCampaignRow";

export const dynamic = "force-dynamic";

export default async function OrgDashboardPage() {
  const { profile } = await requireRole("ORGANIZATION");
  const t = await getTranslations();
  const format = await getFormatter();
  const data = await getOrgDashboard(profile.id);

  const tiles = [
    { label: t("org.campaignsRun"), value: format.number(data.stats.campaignsRun, "integer") },
    { label: t("org.volunteersEngaged"), value: format.number(data.stats.volunteersEngaged, "integer") },
    { label: t("org.totalRaised"), value: format.number(data.stats.totalRaised, "dzd") },
  ];
  const sections = [
    { key: "ongoing", items: data.ongoing },
    { key: "upcoming", items: data.upcoming },
    { key: "history", items: data.history },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display m-0 inline-flex items-center gap-2.5 text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]">
          {profile.name}
          {profile.verified ? <BadgeCheck className="size-5 text-primary" aria-label={t("common.verified")} /> : null}
        </h1>
        <div className="flex flex-wrap gap-2">
          {profile.domains.map((d) => (
            <DomainBadge key={d} domain={d} />
          ))}
        </div>
        {profile.description ? <p className="text-sm text-muted-foreground">{profile.description}</p> : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild size="sm">
            <Link href="/org/campaigns">
              <Plus className="size-4" />
              {t("org.newCampaign")}
            </Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href="/org/scanner">
              <ScanLine className="size-4" />
              {t("nav.scanner")}
            </Link>
          </Button>
        </div>
      </div>

      <div data-stagger="" className="grid grid-cols-3 gap-4">
        {tiles.map((tile) => (
          <Card key={tile.label} className="gap-1 py-5">
            <CardContent className="px-5">
              <p className="m-0 text-xs uppercase tracking-[0.12em] text-ink-muted">{tile.label}</p>
              <p className="font-display m-0 mt-1.5 text-[clamp(1.25rem,2.4vw,1.75rem)] leading-none tracking-[-0.02em] text-ochre">
                {tile.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {sections.map((section) => (
        <section key={section.key} className="space-y-3">
          <h2 className="font-display text-lg font-semibold">
            {t(`org.${section.key}`)} <span className="text-muted-foreground">({section.items.length})</span>
          </h2>
          {section.items.length === 0 ? (
            <p className="tw-glass m-0 px-5 py-6 text-center text-sm text-ink-muted">{t("org.noCampaigns")}</p>
          ) : (
            <ul data-stagger="" className="grid gap-4 md:grid-cols-2">
              {section.items.map((c) => (
                <OrgCampaignRow key={c.id} c={c} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
