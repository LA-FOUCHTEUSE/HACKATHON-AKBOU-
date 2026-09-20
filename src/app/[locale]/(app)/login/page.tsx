import type { Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { loginAs } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const DEMO_EMAILS = new Set(["benevole.demo@tawa3.dz", "org.demo@tawa3.dz", "sponsor.demo@tawa3.dz"]);
const GROUPS: Array<{ role: Role; key: "volunteers" | "organizations" | "sponsors" }> = [
  { role: "VOLUNTEER", key: "volunteers" },
  { role: "ORGANIZATION", key: "organizations" },
  { role: "SPONSOR", key: "sponsors" },
];

export default async function LoginPage() {
  const t = await getTranslations("auth");
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { displayName: "asc" }],
    select: {
      id: true,
      role: true,
      email: true,
      displayName: true,
      volunteer: { select: { city: true } },
      organization: { select: { city: true } },
      sponsor: { select: { sector: true } },
    },
  });
  // Demo accounts first within each group.
  users.sort((a, b) => Number(DEMO_EMAILS.has(b.email)) - Number(DEMO_EMAILS.has(a.email)));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/volunteer/onboarding">{t("signupVolunteer")}</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/org/onboarding">{t("signupOrganization")}</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {GROUPS.map((group) => (
          <Card key={group.role} className="gap-3 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-base">{t(group.key)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4">
              {users
                .filter((u) => u.role === group.role)
                .map((u) => (
                  <form key={u.id} action={loginAs.bind(null, u.id)}>
                    <button
                      type="submit"
                      className="flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-start text-sm hover:bg-muted"
                    >
                      <span>
                        <span className="block font-medium">{u.displayName}</span>
                        <span className="block text-xs text-muted-foreground">
                          {u.volunteer?.city ?? u.organization?.city ?? u.sponsor?.sector ?? ""}
                        </span>
                      </span>
                      {DEMO_EMAILS.has(u.email) ? (
                        <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          {t("demo")}
                        </span>
                      ) : null}
                    </button>
                  </form>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
