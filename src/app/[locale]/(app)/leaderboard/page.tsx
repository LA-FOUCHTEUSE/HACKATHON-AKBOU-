import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { getLeaderboard, getNationalRank } from "@/lib/points";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const t = await getTranslations();
  // Independent round trips run together: each one pays the network latency to
  // the database once, instead of the page paying it three times in a row.
  const [user, rows, total] = await Promise.all([
    getCurrentUser(),
    getLeaderboard(),
    prisma.volunteerProfile.count(),
  ]);
  const me = user?.role === "VOLUNTEER" ? user.volunteer : null;
  const myRank = me ? await getNationalRank(me) : null;

  return (
    <div>
      <PageHeader title={t("leaderboard.title")} subtitle={t("leaderboard.subtitle")}>
        {myRank ? (
          <span className="tw-glass px-4 py-2 text-sm font-medium text-ochre">
            {t("leaderboard.you", { rank: myRank, total })}
          </span>
        ) : null}
      </PageHeader>

      <ol data-stagger="" className="tw-glass m-0 list-none overflow-hidden p-0">
        {rows.map((r, index) => {
          const isMe = me?.id === r.id;
          // Ochre marks the podium, matching how the landing page ranks its top three.
          const podium = index < 3;
          return (
            <li
              key={r.id}
              data-row=""
              className={cn(
                "flex items-center gap-4 border-t border-hairline px-5 py-3.5 first:border-t-0",
                isMe && "bg-org/[0.07]",
              )}
            >
              <span
                className={cn(
                  "font-display w-9 shrink-0 text-center text-lg font-semibold tabular-nums",
                  podium ? "text-ochre" : "text-ink-muted",
                )}
              >
                {r.rank}
              </span>
              <span className="flex-1 min-w-0">
                <span className={cn("block truncate", isMe && "font-semibold")}>{r.fullName}</span>
                <span className="block text-xs text-ink-muted">
                  {[r.city, t(r.tierKey), t("common.events", { count: r.eventsCompleted })]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <span className="shrink-0 font-medium tabular-nums">
                {t("common.points", { count: r.totalPoints })}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
