import { useTranslations } from "next-intl";
import type { TierProgress as Progress } from "@/lib/tiers";

export function TierProgress({ progress }: { progress: Progress }) {
  const t = useTranslations();
  return (
    <div className="space-y-2">
      <div className="h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percent}%` }} />
      </div>
      <p className="text-sm text-muted-foreground">
        {progress.next
          ? t("profile.nextTier", { points: progress.pointsToNext, tier: t(progress.next.key) })
          : t("profile.maxTier")}
      </p>
    </div>
  );
}
