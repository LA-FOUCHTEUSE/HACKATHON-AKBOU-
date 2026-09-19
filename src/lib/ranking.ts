import type { Prisma } from "@prisma/client";

// National ranking order (spec section 8): totalPoints desc, eventsCompleted desc.
// id asc is a deterministic tie-breaker so every volunteer has a unique 1-based position.
// Pure module (no "server-only") so seed verification scripts use the exact same ordering.

export const RANKING_ORDER = [
  { totalPoints: "desc" },
  { eventsCompleted: "desc" },
  { id: "asc" },
] as const satisfies Prisma.VolunteerProfileOrderByWithRelationInput[];

export interface RankKey {
  id: string;
  totalPoints: number;
  eventsCompleted: number;
}

// Volunteers strictly ahead of `p` in RANKING_ORDER. Rank = count + 1.
export function aheadOfWhere(p: RankKey): Prisma.VolunteerProfileWhereInput {
  return {
    OR: [
      { totalPoints: { gt: p.totalPoints } },
      { totalPoints: p.totalPoints, eventsCompleted: { gt: p.eventsCompleted } },
      { totalPoints: p.totalPoints, eventsCompleted: p.eventsCompleted, id: { lt: p.id } },
    ],
  };
}

export async function nationalRank(
  db: { volunteerProfile: { count(args: { where: Prisma.VolunteerProfileWhereInput }): Promise<number> } },
  p: RankKey,
): Promise<number> {
  return (await db.volunteerProfile.count({ where: aheadOfWhere(p) })) + 1;
}
