import { useTranslations } from "next-intl";
import type { TierProgress as Progress } from "@/lib/tiers";

export function TierProgress({ progress }: { progress: Progress }) {
  const t = useTranslations();
  return (
    <div className="space-y-2">
      <div className="h-2 overflow-hidden rounded-full bg-hairline" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="h-full rounded-full bg-ochre transition-[width] duration-700 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p className="m-0 text-sm text-ink-muted">
        {progress.next
          ? t("profile.nextTier", { points: progress.pointsToNext, tier: t(progress.next.key) })
          : t("profile.maxTier")}
      </p>
    </div>
  );
}
