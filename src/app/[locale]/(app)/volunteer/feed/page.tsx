import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/session";
import { getFeed } from "@/lib/campaigns";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { PageHeader } from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

export default async function VolunteerFeedPage() {
  const { profile } = await requireRole("VOLUNTEER");
  const t = await getTranslations("campaigns");
  const campaigns = await getFeed(profile.id);

  return (
    <div>
      <PageHeader title={t("feedTitle")} subtitle={t("feedSubtitle")} />
      <div data-stagger="" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} volunteerControls />
        ))}
      </div>
    </div>
  );
}
