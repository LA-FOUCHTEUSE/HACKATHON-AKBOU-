import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CHECKIN_ELIGIBLE_STATUSES, ENROLLABLE_STATUSES } from "@/lib/constants";
import { CheckInQr } from "@/components/volunteer/CheckInQr";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CheckInPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const { profile } = await requireRole("VOLUNTEER");
  const t = await getTranslations();

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, title: true, status: true },
  });
  if (!campaign) notFound();
  const enrollment = await prisma.enrollment.findUnique({
    where: { volunteerId_campaignId: { volunteerId: profile.id, campaignId } },
    select: { status: true },
  });
  const checkIn =
    enrollment?.status === "ATTENDED"
      ? await prisma.checkIn.findUnique({
          where: { volunteerId_campaignId: { volunteerId: profile.id, campaignId } },
          select: { pointsAwarded: true },
        })
      : null;

  const isOpen = (ENROLLABLE_STATUSES as readonly string[]).includes(campaign.status);
  // Eligibility rules: ARCHITECTURE.md section 21.5 (WAITLISTED volunteers get a QR too).
  const eligible = enrollment && (CHECKIN_ELIGIBLE_STATUSES as readonly string[]).includes(enrollment.status);

  return (
    <div className="mx-auto max-w-md space-y-5 text-center">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t("checkin.title")}</h1>
        <p className="font-medium">{campaign.title}</p>
      </div>

      {enrollment?.status === "ATTENDED" ? (
        <div className="space-y-1 rounded-lg border p-4">
          <p className="font-medium text-primary">{t("checkin.alreadyAttended")}</p>
          {checkIn ? <p className="text-sm">{t("scanner.pointsAwarded", { points: checkIn.pointsAwarded })}</p> : null}
        </div>
      ) : !eligible ? (
        <div className="space-y-3 rounded-lg border p-4">
          <p>{t("checkin.notEnrolled")}</p>
          <Button asChild variant="outline">
            <Link href={`/campaigns/${campaign.id}`}>{t("common.see")}</Link>
          </Button>
        </div>
      ) : !isOpen ? (
        <p className="rounded-lg border p-4">{t("checkin.closed")}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t("checkin.instructions")}</p>
          {enrollment.status === "WAITLISTED" ? (
            <p className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900">{t("checkin.waitlistNotice")}</p>
          ) : null}
          <CheckInQr campaignId={campaign.id} />
        </>
      )}
    </div>
  );
}
