import type { CampaignStatus, EnrollmentStatus, Role, SponsorTier } from "@prisma/client";

export const TOKEN_TTL_MINUTES = 120;
// An unused token is reused while at least this many minutes remain.
export const TOKEN_REUSE_MIN_REMAINING_MINUTES = 10;
// Spec default: the scanned volunteer must already be enrolled.
export const ALLOW_WALK_IN = false;

export const RECOMMENDATION_FANOUT_LIMIT = 100;
export const LEADERBOARD_SIZE = 20;

export const ROLE_HOME: Record<Role, string> = {
  VOLUNTEER: "/volunteer/feed",
  ORGANIZATION: "/org/dashboard",
  SPONSOR: "/sponsor/browse",
};

export const FEED_STATUSES = ["PUBLISHED", "ONGOING"] as const satisfies readonly CampaignStatus[];
export const ENROLLABLE_STATUSES = FEED_STATUSES;
// Statuses that hold a seat against capacity (see ARCHITECTURE.md, conflict C5).
export const SEAT_STATUSES = ["ENROLLED", "ATTENDED"] as const satisfies readonly EnrollmentStatus[];
// Statuses eligible for check-in (see ARCHITECTURE.md, section 21.5).
export const CHECKIN_ELIGIBLE_STATUSES = [
  "ENROLLED",
  "WAITLISTED",
  "NO_SHOW",
] as const satisfies readonly EnrollmentStatus[];

export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
] as const satisfies readonly CampaignStatus[];

export const SPONSOR_TIERS = ["STARTER", "PRO", "MAX"] as const satisfies readonly SponsorTier[];
