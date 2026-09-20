import { useFormatter, useTranslations } from "next-intl";
import { BadgeCheck, CalendarDays, MapPin, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { CampaignCardData } from "@/lib/campaigns";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { DomainBadge } from "./DomainBadge";
import { FundingProgress } from "./FundingProgress";
import { EnrollButton } from "./EnrollButton";
import { FavoriteButton } from "./FavoriteButton";

type Props = {
  campaign: CampaignCardData;
  /** Show enroll and favorite controls for a logged-in volunteer. */
  volunteerControls?: boolean;
  /** Replace the default footer (e.g. sponsor CTA). */
  footer?: React.ReactNode;
};

export function CampaignCard({ campaign: c, volunteerControls = false, footer }: Props) {
  const t = useTranslations();
  const format = useFormatter();

  return (
    <Card className="group/campaign flex flex-col gap-3 py-4 transition-transform duration-300 hover:-translate-y-0.5">
      <CardHeader className="gap-2 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <DomainBadge domain={c.domain} />
            {c.status === "ONGOING" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ochre/40 bg-ochre/10 px-3 py-1 text-[0.6875rem] uppercase tracking-[0.1em] text-ochre">
                <span className="size-1.5 rounded-full bg-ochre" />
                {t("campaigns.ongoing")}
              </span>
            ) : null}
          </div>
          {volunteerControls ? <FavoriteButton campaignId={c.id} isFavorite={c.isFavorite} /> : null}
        </div>
        <Link
          href={`/campaigns/${c.id}`}
          className="font-display text-base font-semibold leading-snug transition-colors group-hover/campaign:text-org"
        >
          {c.title}
        </Link>
        <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          {t("common.by", { org: c.orgName })}
          {c.orgVerified ? <BadgeCheck className="size-4 text-primary" aria-label={t("common.verified")} /> : null}
        </p>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 px-4 text-sm">
        <p className="inline-flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-ink-muted transition-colors group-hover/campaign:text-org" />
          {format.dateTime(c.startAt, "long")}
        </p>
        {c.city ? (
          <p className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-ink-muted transition-colors group-hover/campaign:text-org" />
            {c.city}
          </p>
        ) : null}
        <p className="flex items-center gap-2">
          <Users className="size-4 shrink-0 text-ink-muted transition-colors group-hover/campaign:text-org" />
          {c.remaining === null ? t("common.unlimited") : t("common.seatsLeft", { count: c.remaining })}
          <span className="text-muted-foreground">
            {" - "}
            {t("common.points", { count: c.pointsValue })}
          </span>
        </p>
        {c.needsFunding || c.sponsorRequested ? <FundingProgress raised={c.raised} goal={c.fundingGoal} /> : null}
      </CardContent>
      <CardFooter className="px-4">
        {footer ??
          (volunteerControls ? (
            <EnrollButton campaignId={c.id} status={c.myStatus} canEnroll />
          ) : (
            <EnrollButton campaignId={c.id} status={null} canEnroll={false} />
          ))}
      </CardFooter>
    </Card>
  );
}
