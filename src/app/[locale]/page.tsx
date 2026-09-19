import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const LANDING_DOMAINS = ["ecology", "health", "social", "education", "skills", "inclusion"] as const;

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const user = await getCurrentUser();

  return (
    <div className="space-y-10">
      <section className="space-y-4 py-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">{t("subtitle")}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {user ? (
            <Button asChild size="lg">
              <Link href={ROLE_HOME[user.role]}>{t("ctaCampaigns")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/volunteer/onboarding">{t("ctaVolunteer")}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/org/onboarding">{t("ctaOrganization")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">{t("ctaLogin")}</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("domainsTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LANDING_DOMAINS.map((key) => (
            <Card key={key} className="gap-2 py-4">
              <CardHeader className="px-4">
                <CardTitle className="text-base">{t(`domains.${key}.title`)}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 text-sm text-muted-foreground">{t(`domains.${key}.description`)}</CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <Button asChild variant="link">
            <Link href="/campaigns">{t("ctaCampaigns")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
