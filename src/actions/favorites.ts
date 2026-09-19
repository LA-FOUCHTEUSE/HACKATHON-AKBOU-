"use server";

import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/session";
import { runAction, parse } from "@/lib/action";
import { fail, ok, type ActionResult } from "@/lib/result";
import { isUniqueViolation } from "@/lib/errors";
import { idSchema } from "@/lib/validation";
import { revalidate } from "@/lib/revalidate";

export async function toggleFavorite(campaignId: string): Promise<ActionResult<{ favorited: boolean }>> {
  return runAction("toggleFavorite", async () => {
    const actor = await getActor("VOLUNTEER");
    if (!actor.ok) return actor;
    const id = parse(idSchema, campaignId);
    if (!id.ok) return id;

    const campaign = await prisma.campaign.findUnique({ where: { id: id.data }, select: { id: true } });
    if (!campaign) return fail("NOT_FOUND");

    const key = { volunteerId_campaignId: { volunteerId: actor.data.profile.id, campaignId: campaign.id } };
    const existing = await prisma.favorite.findUnique({ where: key, select: { id: true } });
    let favorited: boolean;
    if (existing) {
      await prisma.favorite.deleteMany({ where: { id: existing.id } });
      favorited = false;
    } else {
      try {
        await prisma.favorite.create({ data: { volunteerId: actor.data.profile.id, campaignId: campaign.id } });
      } catch (e) {
        if (!isUniqueViolation(e)) throw e; // double click: already favorited
      }
      favorited = true;
    }

    revalidate.feeds();
    revalidate.campaign();
    revalidate.volunteerProfile();
    return ok({ favorited });
  });
}
