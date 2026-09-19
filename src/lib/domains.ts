import type { ActivityDomain } from "@prisma/client";

export const ACTIVITY_DOMAINS = [
  "ECOLOGY",
  "ENVIRONMENT",
  "EDUCATION",
  "HEALTH",
  "SOCIAL",
  "CULTURE",
  "SPORT",
  "HUMANITARIAN",
  "TECH",
  "ANIMAL_WELFARE",
] as const satisfies readonly ActivityDomain[];

// Placeholder color block per domain when a campaign has no cover image.
export const DOMAIN_COLORS: Record<ActivityDomain, string> = {
  ECOLOGY: "bg-emerald-600",
  ENVIRONMENT: "bg-green-700",
  EDUCATION: "bg-sky-600",
  HEALTH: "bg-rose-600",
  SOCIAL: "bg-amber-600",
  CULTURE: "bg-violet-600",
  SPORT: "bg-orange-600",
  HUMANITARIAN: "bg-red-700",
  TECH: "bg-indigo-600",
  ANIMAL_WELFARE: "bg-lime-700",
};

export function domainKey(domain: ActivityDomain): `domains.${ActivityDomain}` {
  return `domains.${domain}`;
}
