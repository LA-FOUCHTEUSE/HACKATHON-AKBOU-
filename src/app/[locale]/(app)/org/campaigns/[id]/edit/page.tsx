import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { toAlgiersInput } from "@/lib/dates";
import { CampaignForm } from "@/components/campaigns/CampaignForm";

export const dynamic = "force-dynamic";

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireRole("ORGANIZATION");
  const c = await prisma.campaign.findFirst({ where: { id, orgId: profile.id } });
  if (!c || c.status === "CANCELLED") notFound();
  const t = await getTranslations("org");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]">{t("editTitle")}</h1>
      <CampaignForm
        campaignId={c.id}
        defaults={{
          title: c.title,
          description: c.description,
          domain: c.domain,
          city: c.city ?? "",
          location: c.location ?? "",
          startAt: toAlgiersInput(c.startAt),
          endAt: toAlgiersInput(c.endAt),
          capacity: c.capacity,
          pointsValue: c.pointsValue,
          status: c.status,
          needsFunding: c.needsFunding,
          fundingGoal: c.fundingGoal ?? "",
          sponsorRequested: c.sponsorRequested,
        }}
      />
    </div>
  );
}
