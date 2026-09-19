import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/session";
import { getOrgCaisse } from "@/lib/caisse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FundingProgress } from "@/components/campaigns/FundingProgress";

export const dynamic = "force-dynamic";

export default async function OrgCaissePage() {
  const { profile } = await requireRole("ORGANIZATION");
  const t = await getTranslations();
  const format = await getFormatter();
  const caisse = await getOrgCaisse(profile.id);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t("caisse.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("caisse.subtitle")}</p>
      </div>

      <Card className="gap-1 py-4">
        <CardContent className="px-4">
          <p className="text-xs text-muted-foreground">{t("caisse.total")}</p>
          <p className="text-3xl font-bold text-primary">{format.number(caisse.total, "dzd")}</p>
        </CardContent>
      </Card>

      {caisse.campaigns.length === 0 ? <p className="text-muted-foreground">{t("caisse.noCampaigns")}</p> : null}

      {caisse.campaigns.map((c) => (
        <Card key={c.id} className="gap-3 py-4">
          <CardHeader className="gap-2 px-4">
            <CardTitle className="text-base">
              <Link href={`/campaigns/${c.id}`} className="hover:text-primary">
                {c.title}
              </Link>
            </CardTitle>
            <p className="text-xs text-muted-foreground">{t(`status.campaign.${c.status}`)}</p>
            <FundingProgress raised={c.raised} goal={c.fundingGoal} />
            {c.percent !== null ? (
              <p className="text-xs font-medium">{t("caisse.progress", { percent: c.percent })}</p>
            ) : null}
          </CardHeader>
          <CardContent className="px-4">
            {c.contributions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("caisse.empty")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-start text-xs text-muted-foreground">
                      <th className="py-2 text-start font-medium">{t("caisse.contributor")}</th>
                      <th className="py-2 text-start font-medium">{t("caisse.type")}</th>
                      <th className="py-2 text-start font-medium">{t("caisse.date")}</th>
                      <th className="py-2 text-end font-medium">{t("caisse.amount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {c.contributions.map((x) => (
                      <tr key={`${x.type}-${x.id}`}>
                        <td className="py-2">{x.contributorName}</td>
                        <td className="py-2">
                          {x.type === "SPONSORSHIP" && x.tier
                            ? `${t("caisse.sponsorship")} - ${t(`packs.${x.tier}.name`)}`
                            : t("caisse.donation")}
                        </td>
                        <td className="py-2 whitespace-nowrap">{format.dateTime(x.createdAt, "short")}</td>
                        <td className="py-2 text-end font-semibold whitespace-nowrap">
                          {format.number(x.amountDZD, "dzd")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
