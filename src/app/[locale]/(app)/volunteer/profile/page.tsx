import { getFormatter, getTranslations } from "next-intl/server";
import { QrCode } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/session";
import { getVolunteerProfileStats } from "@/lib/volunteers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierProgress } from "@/components/volunteer/TierProgress";
import { DomainBadge } from "@/components/campaigns/DomainBadge";

export const dynamic = "force-dynamic";

export default async function VolunteerProfilePage() {
  const { profile } = await requireRole("VOLUNTEER");
  const stats = await getVolunteerProfileStats(profile);
  const t = await getTranslations();
  const format = await getFormatter();

  const tiles = [
    { label: t("profile.points"), value: format.number(profile.totalPoints, "integer") },
    { label: t("profile.events"), value: format.number(profile.eventsCompleted, "integer") },
    { label: t("profile.rank"), value: t("profile.rankValue", { rank: stats.rank, total: stats.totalVolunteers }) },
    { label: t("profile.tier"), value: t(stats.progress.current.key) },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{profile.fullName}</h1>
        {profile.city ? <p className="text-muted-foreground">{profile.city}</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label} className="gap-1 py-4">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">{tile.label}</p>
              <p className="text-xl font-bold">{tile.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <TierProgress progress={stats.progress} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("profile.upcoming")}</h2>
        {stats.upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("profile.noUpcoming")}</p>
        ) : (
          <ul className="space-y-2">
            {stats.upcoming.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div className="space-y-1">
                  <Link href={`/campaigns/${c.id}`} className="font-medium hover:text-primary">
                    {c.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {format.dateTime(c.startAt, "long")}
                    {c.myStatus ? ` - ${t(`status.enrollment.${c.myStatus}`)}` : ""}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/volunteer/checkin/${c.id}`}>
                    <QrCode className="size-4" />
                    {t("campaigns.showQr")}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="gap-3 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-base">{t("profile.history")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <ul className="divide-y text-sm">
              {stats.history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    <span className="block">
                      {h.reason === "OPENING_BALANCE" ? t("profile.reasonOpening") : (h.campaignTitle ?? t("profile.reasonAttended"))}
                    </span>
                    <span className="block text-xs text-muted-foreground">{format.dateTime(h.createdAt, "short")}</span>
                  </span>
                  <span className="shrink-0 font-semibold text-primary" dir="ltr">
                    +{format.number(h.amount, "integer")}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="gap-3 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-base">{t("profile.attended")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            {stats.attended.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("profile.noAttended")}</p>
            ) : (
              <ul className="divide-y text-sm">
                {stats.attended.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="space-y-1">
                      <Link href={`/campaigns/${a.campaign.id}`} className="block hover:text-primary">
                        {a.campaign.title}
                      </Link>
                      <DomainBadge domain={a.campaign.domain} />
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{format.dateTime(a.checkedInAt, "short")}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.favorites.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t("profile.favorites")}</h2>
          <ul className="space-y-2 text-sm">
            {stats.favorites.map((c) => (
              <li key={c.id}>
                <Link href={`/campaigns/${c.id}`} className="hover:text-primary">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
