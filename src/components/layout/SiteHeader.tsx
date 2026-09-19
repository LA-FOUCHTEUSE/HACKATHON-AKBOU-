import { getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";

type NavItem = { href: string; key: string; badge?: number };

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const tApp = await getTranslations("app");
  const user = await getCurrentUser();
  const unread = user ? await prisma.notification.count({ where: { userId: user.id, read: false } }) : 0;

  let items: NavItem[];
  switch (user?.role) {
    case "VOLUNTEER":
      items = [
        { href: "/volunteer/feed", key: "feed" },
        { href: "/volunteer/profile", key: "profile" },
        { href: "/volunteer/inbox", key: "inbox", badge: unread },
        { href: "/leaderboard", key: "leaderboard" },
      ];
      break;
    case "ORGANIZATION":
      items = [
        { href: "/org/dashboard", key: "dashboard" },
        { href: "/org/campaigns", key: "myCampaigns" },
        { href: "/org/scanner", key: "scanner" },
        { href: "/org/caisse", key: "caisse" },
        { href: "/org/inbox", key: "inbox", badge: unread },
      ];
      break;
    case "SPONSOR":
      items = [
        { href: "/sponsor/browse", key: "browse" },
        { href: "/campaigns", key: "campaigns" },
        { href: "/leaderboard", key: "leaderboard" },
      ];
      break;
    default:
      items = [
        { href: "/campaigns", key: "campaigns" },
        { href: "/leaderboard", key: "leaderboard" },
        { href: "/login", key: "login" },
      ];
  }

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-primary">
          {tApp("name")}
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="inline-flex items-center gap-1 hover:text-primary">
              {t(item.key)}
              {item.badge ? (
                <span className="min-w-5 rounded-full bg-primary px-1.5 text-center text-xs font-semibold text-primary-foreground">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher label={t("language")} />
          {user ? (
            <form action={logoutAction} className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">{user.displayName}</span>
              <Button type="submit" variant="ghost" size="sm" aria-label={t("logout")} title={t("logout")}>
                <LogOut className="size-4 rtl:rotate-180" />
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  );
}
