import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { getFeed } from "@/lib/campaigns";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { PageHeader } from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

export default async function PublicCampaignsPage() {
  const t = await getTranslations("campaigns");
  const user = await getCurrentUser();
  const volunteerId = user?.role === "VOLUNTEER" ? (user.volunteer?.id ?? null) : null;
  const campaigns = await getFeed(volunteerId);

  return (
    <div>
      <PageHeader title={t("publicTitle")} />
      <div data-stagger="" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} volunteerControls={volunteerId !== null} />
        ))}
      </div>
    </div>
  );
}
