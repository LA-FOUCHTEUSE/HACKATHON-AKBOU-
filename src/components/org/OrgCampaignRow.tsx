import type { ActivityDomain, CampaignStatus } from "@prisma/client";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DomainBadge } from "@/components/campaigns/DomainBadge";
import { Button } from "@/components/ui/button";
import { CancelCampaignButton } from "./CancelCampaignButton";

export interface OrgCampaignRowData {
  id: string;
  title: string;
  domain: ActivityDomain;
  city: string | null;
  startAt: Date;
  status: CampaignStatus;
  capacity: number;
  participants: number;
  raised?: number;
  fundingGoal: number | null;
}

export function OrgCampaignRow({ c, manage = false }: { c: OrgCampaignRowData; manage?: boolean }) {
  const t = useTranslations();
  const format = useFormatter();
  const cancellable = c.status !== "CANCELLED" && c.status !== "COMPLETED";

  return (
    <li className="space-y-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <DomainBadge domain={c.domain} />
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{t(`status.campaign.${c.status}`)}</span>
      </div>
      <Link href={`/campaigns/${c.id}`} className="block font-medium hover:text-primary">
        {c.title}
      </Link>
      <p className="text-xs text-muted-foreground">
        {format.dateTime(c.startAt, "long")}
        {c.city ? ` - ${c.city}` : ""}
        {" - "}
        {t("common.participants", { count: c.participants })}
        {c.capacity > 0 ? ` / ${c.capacity}` : ""}
        {c.raised !== undefined && c.fundingGoal ? ` - ${format.number(c.raised, "dzd")} / ${format.number(c.fundingGoal, "dzd")}` : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="secondary">
          <Link href={`/org/campaigns/${c.id}/participants`}>{t("org.participants")}</Link>
        </Button>
        {manage && cancellable ? (
          <>
            <Button asChild size="sm" variant="outline">
              <Link href={`/org/campaigns/${c.id}/edit`}>{t("common.edit")}</Link>
            </Button>
            <CancelCampaignButton campaignId={c.id} />
          </>
        ) : null}
      </div>
    </li>
  );
}
