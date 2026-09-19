export const TIERS = [
  { key: "tier.newcomer", min: 0 },
  { key: "tier.contributor", min: 300 },
  { key: "tier.committed", min: 800 },
  { key: "tier.champion", min: 1800 },
  { key: "tier.legend", min: 4000 },
] as const;

export type Tier = (typeof TIERS)[number];
export type TierKey = Tier["key"];

export function getTier(points: number): Tier {
  let current: Tier = TIERS[0];
  for (const tier of TIERS) {
    if (points >= tier.min) current = tier;
  }
  return current;
}

export function getNextTier(points: number): Tier | null {
  return TIERS.find((tier) => tier.min > points) ?? null;
}

export interface TierProgress {
  current: Tier;
  next: Tier | null;
  pointsToNext: number;
  percent: number;
}

export function getTierProgress(points: number): TierProgress {
  const current = getTier(points);
  const next = getNextTier(points);
  if (!next) return { current, next: null, pointsToNext: 0, percent: 100 };
  const span = next.min - current.min;
  const percent = Math.min(100, Math.max(0, Math.floor(((points - current.min) / span) * 100)));
  return { current, next, pointsToNext: next.min - points, percent };
}
