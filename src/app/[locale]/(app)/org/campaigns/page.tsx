import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/session";
import { getOrgCampaigns } from "@/lib/campaigns";
import { defaultCampaignSlot } from "@/lib/dates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignForm, type CampaignFormDefaults } from "@/components/campaigns/CampaignForm";
import { OrgCampaignRow } from "@/components/org/OrgCampaignRow";

export const dynamic = "force-dynamic";

export default async function OrgCampaignsPage() {
  const { profile } = await requireRole("ORGANIZATION");
  const t = await getTranslations("org");
  const campaigns = await getOrgCampaigns(profile.id);

  const slot = defaultCampaignSlot();
  const defaults: CampaignFormDefaults = {
    title: "",
    description: "",
    domain: profile.domains[0] ?? "SOCIAL",
    city: profile.city ?? "",
    location: "",
    startAt: slot.startAt,
    endAt: slot.endAt,
    capacity: 20,
    pointsValue: 100,
    status: "PUBLISHED",
    needsFunding: false,
    fundingGoal: "",
    sponsorRequested: false,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <section className="space-y-3">
        <h1 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]">{t("campaignsTitle")}</h1>
        {campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noCampaigns")}</p>
        ) : (
          <ul className="space-y-3">
            {campaigns.map((c) => (
              <OrgCampaignRow key={c.id} c={c} manage />
            ))}
          </ul>
        )}
      </section>
      <Card className="h-fit gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle>{t("newCampaign")}</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <CampaignForm defaults={defaults} />
        </CardContent>
      </Card>
    </div>
  );
}
