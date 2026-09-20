import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { getLeaderboard, getNationalRank } from "@/lib/points";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const [rows, total] = await Promise.all([getLeaderboard(), prisma.volunteerProfile.count()]);
  const me = user?.role === "VOLUNTEER" ? user.volunteer : null;
  const myRank = me ? await getNationalRank(me) : null;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t("leaderboard.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("leaderboard.subtitle")}</p>
        {myRank ? <p className="font-medium text-primary">{t("leaderboard.you", { rank: myRank, total })}</p> : null}
      </div>
      <ol className="divide-y rounded-lg border">
        {rows.map((r) => (
          <li
            key={r.id}
            className={cn("flex items-center gap-3 px-4 py-3", me?.id === r.id && "bg-primary/5 font-semibold")}
          >
            <span className="w-8 shrink-0 text-center text-lg font-bold text-muted-foreground">{r.rank}</span>
            <span className="flex-1">
              <span className="block">{r.fullName}</span>
              <span className="block text-xs text-muted-foreground">
                {[r.city, t(r.tierKey), t("common.events", { count: r.eventsCompleted })].filter(Boolean).join(" - ")}
              </span>
            </span>
            <span className="shrink-0 font-semibold">{t("common.points", { count: r.totalPoints })}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
