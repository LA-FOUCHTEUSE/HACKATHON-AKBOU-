import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ScanLine } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/session";
import { getParticipants } from "@/lib/campaigns";
import { Button } from "@/components/ui/button";
import { AddParticipantForm } from "@/components/org/AddParticipantForm";
import { ParticipantActions } from "@/components/org/ParticipantActions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  ENROLLED: "bg-sky-100 text-sky-900",
  WAITLISTED: "bg-amber-100 text-amber-900",
  ATTENDED: "bg-emerald-100 text-emerald-900",
  WITHDRAWN: "bg-muted text-muted-foreground",
  NO_SHOW: "bg-rose-100 text-rose-900",
};

export default async function ParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireRole("ORGANIZATION");
  const data = await getParticipants(id, profile.id);
  if (!data) notFound();
  const t = await getTranslations();
  const format = await getFormatter();
  const { campaign, rows, counts } = data;
  const closed = campaign.status === "CANCELLED";

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{t("participants.title")}</p>
        <h1 className="text-2xl font-bold">{campaign.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t(`status.campaign.${campaign.status}`)} - {format.dateTime(campaign.startAt, "long")} -{" "}
          {t("common.points", { count: campaign.pointsValue })}
        </p>
        <div className="flex flex-wrap gap-2 pt-1 text-xs">
          {Object.entries(counts).map(([status, n]) => (
            <span key={status} className={cn("rounded-full px-2 py-0.5", STATUS_STYLE[status])}>
              {t(`status.enrollment.${status}`)}: {n}
            </span>
          ))}
        </div>
      </div>

      {!closed ? (
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <AddParticipantForm campaignId={campaign.id} />
          <Button asChild variant="secondary">
            <Link href="/org/scanner">
              <ScanLine className="size-4" />
              {t("participants.scanLink")}
            </Link>
          </Button>
        </div>
      ) : null}

      <ul className="divide-y rounded-lg border">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="space-y-1">
              <p className="font-medium">{r.volunteer.fullName}</p>
              <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className={cn("rounded-full px-2 py-0.5", STATUS_STYLE[r.status])}>
                  {t(`status.enrollment.${r.status}`)}
                </span>
                {r.volunteer.city}
                {r.checkedInAt ? ` - ${t("participants.checkedInAt")} ${format.dateTime(r.checkedInAt, "time")}` : ""}
              </p>
            </div>
            {!closed ? <ParticipantActions enrollmentId={r.id} status={r.status} name={r.volunteer.fullName} /> : null}
          </li>
        ))}
        {rows.length === 0 ? <li className="px-4 py-6 text-sm text-muted-foreground">{t("common.empty")}</li> : null}
      </ul>
    </div>
  );
}
