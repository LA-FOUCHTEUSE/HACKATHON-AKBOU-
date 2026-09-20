import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";
import { SignupForm } from "@/components/volunteer/SignupForm";

export const dynamic = "force-dynamic";

export default async function VolunteerOnboardingPage() {
  const user = await getCurrentUser();
  if (user) redirect({ href: ROLE_HOME[user.role], locale: await getLocale() });
  const t = await getTranslations("onboarding");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t("volunteerTitle")}</h1>
        <p className="text-muted-foreground">{t("volunteerSubtitle")}</p>
      </div>
      <SignupForm />
    </div>
  );
}
