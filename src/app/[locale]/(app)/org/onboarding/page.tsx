import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";
import { OrgSignupForm } from "@/components/org/OrgSignupForm";

export const dynamic = "force-dynamic";

export default async function OrgOnboardingPage() {
  const user = await getCurrentUser();
  if (user) redirect({ href: ROLE_HOME[user.role], locale: await getLocale() });
  const t = await getTranslations("onboarding");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t("orgTitle")}</h1>
        <p className="text-muted-foreground">{t("orgSubtitle")}</p>
      </div>
      <OrgSignupForm />
    </div>
  );
}
