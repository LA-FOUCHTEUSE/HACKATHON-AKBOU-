import { useFormatter, useTranslations } from "next-intl";

export function FundingProgress({ raised, goal }: { raised: number; goal: number | null }) {
  const t = useTranslations("campaigns");
  const format = useFormatter();
  const percent = goal ? Math.round((raised / goal) * 100) : null;
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">
        {goal
          ? t("raised", { raised: format.number(raised, "dzd"), goal: format.number(goal, "dzd") })
          : t("raisedNoGoal", { raised: format.number(raised, "dzd") })}
      </p>
      {percent !== null ? (
        <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, percent)}%` }} />
        </div>
      ) : null}
    </div>
  );
}
