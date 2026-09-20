import { getFormatter, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { MarkAllReadButton, MarkReadButton } from "./MarkReadButtons";
import { cn } from "@/lib/utils";

type Params = Record<string, string | number>;

/**
 * Renders notifications in the active locale from their stored i18n keys and params.
 * Params ending in "Key" are i18n keys translated first; amounts and dates are formatted.
 */
export async function InboxList({ userId }: { userId: string }) {
  const t = await getTranslations();
  const format = await getFormatter();
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: [{ read: "asc" }, { createdAt: "desc" }],
    take: 50,
  });
  const unread = notifications.filter((n) => !n.read).length;

  function resolve(params: Params | null): Params {
    const out: Params = {};
    for (const [name, value] of Object.entries(params ?? {})) {
      if (name.endsWith("Key") && typeof value === "string") out[name] = t.has(value) ? t(value) : value;
      else if (name === "amount" && typeof value === "number") out[name] = format.number(value, "dzd");
      else if (name === "startAt" && typeof value === "string") out[name] = format.dateTime(new Date(value), "long");
      else out[name] = value;
    }
    return out;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t("inbox.unread", { count: unread })}</p>
        {unread > 0 ? <MarkAllReadButton label={t("inbox.markAll")} /> : null}
      </div>
      {notifications.length === 0 ? (
        <p className="tw-glass px-5 py-8 text-center text-ink-muted">{t("inbox.empty")}</p>
      ) : (
        <ul data-stagger="" className="space-y-2.5">
          {notifications.map((n) => {
            const params = resolve(n.params as Params | null);
            return (
              <li
                key={n.id}
                data-row=""
                className={cn(
                  "tw-glass px-5 py-4",
                  !n.read && "border-s-[3px] border-s-org",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="m-0 flex items-center gap-2 font-display font-semibold">
                      {!n.read ? <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden /> : null}
                      {t(n.titleKey, params)}
                    </p>
                    <p className="text-sm">{t(n.bodyKey, params)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format.dateTime(n.createdAt, "long")}
                      {n.campaignId ? (
                        <>
                          {" - "}
                          <Link
                          href={`/campaigns/${n.campaignId}`}
                          className="text-org underline-offset-4 hover:underline"
                        >
                            {t("inbox.openCampaign")}
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                  {!n.read ? <MarkReadButton id={n.id} label={t("inbox.markRead")} /> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
