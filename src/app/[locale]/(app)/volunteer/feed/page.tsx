import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/session";
import { getFeed } from "@/lib/campaigns";
import { CampaignCard } from "@/components/campaigns/CampaignCard";

export const dynamic = "force-dynamic";

export default async function VolunteerFeedPage() {
  const { profile } = await requireRole("VOLUNTEER");
  const t = await getTranslations("campaigns");
  const campaigns = await getFeed(profile.id);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t("feedTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("feedSubtitle")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} volunteerControls />
        ))}
      </div>
    </div>
  );
}
