"use server";

import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/session";
import { runAction, parse } from "@/lib/action";
import { fail, ok, type ActionResult } from "@/lib/result";
import { campaignCreateSchema, campaignUpdateSchema, idSchema } from "@/lib/validation";
import { notifyMany } from "@/lib/notifications";
import { RECOMMENDATION_FANOUT_LIMIT } from "@/lib/constants";
import { TX_OPTIONS } from "@/lib/points";
import { revalidate } from "@/lib/revalidate";

export async function createCampaign(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction("createCampaign", async () => {
    const actor = await getActor("ORGANIZATION");
    if (!actor.ok) return actor;
    const parsed = parse(campaignCreateSchema, input);
    if (!parsed.ok) return parsed;
    const c = parsed.data;
    const org = actor.data.profile;

    const campaign = await prisma.$transaction(async (tx) => {
      const created = await tx.campaign.create({
        data: {
          orgId: org.id,
          title: c.title,
          description: c.description,
          domain: c.domain,
          city: c.city ?? null,
          location: c.location ?? null,
          startAt: c.startAt,
          endAt: c.endAt,
          capacity: c.capacity,
          pointsValue: c.pointsValue,
          status: c.status,
          needsFunding: c.needsFunding,
          fundingGoal: c.needsFunding ? (c.fundingGoal ?? null) : null,
          sponsorRequested: c.sponsorRequested,
        },
        select: { id: true, title: true },
      });
      if (c.status === "PUBLISHED") {
        const matching = await tx.volunteerProfile.findMany({
          where: { preferredDomains: { has: c.domain } },
          take: RECOMMENDATION_FANOUT_LIMIT,
          select: { userId: true },
        });
        await notifyMany(
          tx,
          matching.map((v) => v.userId),
          "CAMPAIGN_RECOMMENDATION",
          { campaignTitle: created.title, orgName: org.name },
          created.id,
        );
      }
      return created;
    }, TX_OPTIONS);

    revalidate.feeds();
    revalidate.orgDashboard();
    revalidate.orgCampaigns();
    revalidate.sponsorBrowse();
    revalidate.inbox();
    return ok({ id: campaign.id });
  });
}

export async function updateCampaign(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction("updateCampaign", async () => {
    const actor = await getActor("ORGANIZATION");
    if (!actor.ok) return actor;
    const campaignId = parse(idSchema, id);
    if (!campaignId.ok) return campaignId;
    const parsed = parse(campaignUpdateSchema, input);
    if (!parsed.ok) return parsed;
    const c = parsed.data;

    const existing = await prisma.campaign.findFirst({
      where: { id: campaignId.data, orgId: actor.data.profile.id },
      select: { id: true, status: true },
    });
    if (!existing) return fail("NOT_FOUND");
    if (existing.status === "CANCELLED") return fail("CAMPAIGN_CLOSED");

    await prisma.campaign.update({
      where: { id: existing.id },
      data: {
        title: c.title,
        description: c.description,
        domain: c.domain,
        city: c.city ?? null,
        location: c.location ?? null,
        startAt: c.startAt,
        endAt: c.endAt,
        capacity: c.capacity,
        pointsValue: c.pointsValue,
        status: c.status,
        needsFunding: c.needsFunding,
        fundingGoal: c.needsFunding ? (c.fundingGoal ?? null) : null,
        sponsorRequested: c.sponsorRequested,
      },
    });

    revalidate.feeds();
    revalidate.campaign();
    revalidate.orgDashboard();
    revalidate.orgCampaigns();
    revalidate.sponsorBrowse();
    return ok({ id: existing.id });
  });
}

/** Soft delete (spec 7.2.C): sets CANCELLED and notifies every enrolled or waitlisted volunteer. */
export async function deleteCampaign(id: string): Promise<ActionResult<{ notified: number }>> {
  return runAction("deleteCampaign", async () => {
    const actor = await getActor("ORGANIZATION");
    if (!actor.ok) return actor;
    const campaignId = parse(idSchema, id);
    if (!campaignId.ok) return campaignId;
    const org = actor.data.profile;

    const notified = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.findFirst({
        where: { id: campaignId.data, orgId: org.id },
        select: { id: true, title: true, status: true },
      });
      if (!campaign) return null;
      if (campaign.status === "CANCELLED") return 0; // idempotent, no duplicate notices

      await tx.campaign.update({ where: { id: campaign.id }, data: { status: "CANCELLED" } });
      const enrolled = await tx.enrollment.findMany({
        where: { campaignId: campaign.id, status: { in: ["ENROLLED", "WAITLISTED"] } },
        select: { volunteer: { select: { userId: true } } },
      });
      return notifyMany(
        tx,
        enrolled.map((e) => e.volunteer.userId),
        "CAMPAIGN_CANCELLED",
        { campaignTitle: campaign.title, orgName: org.name },
        campaign.id,
      );
    }, TX_OPTIONS);
    if (notified === null) return fail("NOT_FOUND");

    revalidate.feeds();
    revalidate.campaign();
    revalidate.orgDashboard();
    revalidate.orgCampaigns();
    revalidate.inbox();
    revalidate.volunteerProfile();
    revalidate.sponsorBrowse();
    return ok({ notified });
  });
}
