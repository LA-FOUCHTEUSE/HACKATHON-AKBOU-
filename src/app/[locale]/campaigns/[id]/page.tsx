import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { BadgeCheck, CalendarDays, MapPin, Trophy, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getCampaignCard } from "@/lib/campaigns";
import { ENROLLABLE_STATUSES } from "@/lib/constants";
import { DomainBadge } from "@/components/campaigns/DomainBadge";
import { FundingProgress } from "@/components/campaigns/FundingProgress";
import { EnrollButton } from "@/components/campaigns/EnrollButton";
import { FavoriteButton } from "@/components/campaigns/FavoriteButton";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const volunteerId = user?.role === "VOLUNTEER" ? (user.volunteer?.id ?? null) : null;
  const c = await getCampaignCard(id, volunteerId);
  if (!c || c.status === "DRAFT") notFound();

  const t = await getTranslations();
  const format = await getFormatter();
  const open = (ENROLLABLE_STATUSES as readonly string[]).includes(c.status);

  return (
    <article className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <DomainBadge domain={c.domain} />
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{t(`status.campaign.${c.status}`)}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{c.title}</h1>
          {volunteerId ? <FavoriteButton campaignId={c.id} isFavorite={c.isFavorite} /> : null}
        </div>
        <p className="inline-flex items-center gap-1 text-muted-foreground">
          {t("campaigns.organizer")} {c.orgName}
          {c.orgVerified ? <BadgeCheck className="size-4 text-primary" aria-label={t("common.verified")} /> : null}
        </p>
      </header>

      <p className="leading-relaxed whitespace-pre-line">{c.description}</p>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <dt className="font-medium">{t("campaigns.dates")}</dt>
            <dd>
              {t("common.from", { start: format.dateTime(c.startAt, "long") })}{" "}
              {t("common.to", { end: format.dateTime(c.endAt, "long") })}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <dt className="font-medium">{t("campaigns.location")}</dt>
            <dd>{[c.location, c.city].filter(Boolean).join(", ")}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Users className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <dt className="font-medium">{t("campaigns.capacity")}</dt>
            <dd>{c.remaining === null ? t("common.unlimited") : t("common.seatsLeft", { count: c.remaining })}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Trophy className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <dt className="font-medium">{t("campaigns.pointsValue")}</dt>
            <dd>{t("common.points", { count: c.pointsValue })}</dd>
          </div>
        </div>
      </dl>

      {user?.role !== "ORGANIZATION" && user?.role !== "SPONSOR" ? (
        <EnrollButton campaignId={c.id} status={c.myStatus} canEnroll={volunteerId !== null} closed={!open} />
      ) : null}

      {c.needsFunding || c.sponsorRequested ? (
        <section className="space-y-4 rounded-lg border p-4">
          <FundingProgress raised={c.raised} goal={c.fundingGoal} />
        </section>
      ) : null}
    </article>
  );
}
