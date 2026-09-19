"use server";

import type { EnrollmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/session";
import { runAction, parse } from "@/lib/action";
import { fail, ok, type ActionResult } from "@/lib/result";
import { DomainError } from "@/lib/errors";
import { idSchema } from "@/lib/validation";
import { ENROLLABLE_STATUSES, SEAT_STATUSES } from "@/lib/constants";
import { notify } from "@/lib/notifications";
import { remainingSeats } from "@/lib/campaigns";
import { TX_OPTIONS } from "@/lib/points";
import { revalidate } from "@/lib/revalidate";

function revalidateEnrollment() {
  revalidate.feeds();
  revalidate.campaign();
  revalidate.volunteerProfile();
  revalidate.inbox();
  revalidate.orgCampaign();
}

export async function enroll(
  campaignId: string,
): Promise<ActionResult<{ status: EnrollmentStatus; remaining: number | null }>> {
  return runAction("enroll", async () => {
    const actor = await getActor("VOLUNTEER");
    if (!actor.ok) return actor;
    const id = parse(idSchema, campaignId);
    if (!id.ok) return id;
    const volunteerId = actor.data.profile.id;

    const result = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.findUnique({
        where: { id: id.data },
        select: { id: true, title: true, status: true, capacity: true },
      });
      if (!campaign) throw new DomainError("NOT_FOUND");
      if (!(ENROLLABLE_STATUSES as readonly string[]).includes(campaign.status)) {
        throw new DomainError("CAMPAIGN_CLOSED");
      }

      const key = { volunteerId_campaignId: { volunteerId, campaignId: campaign.id } };
      const existing = await tx.enrollment.findUnique({ where: key, select: { status: true } });
      const occupiedNow = () =>
        tx.enrollment.count({ where: { campaignId: campaign.id, status: { in: [...SEAT_STATUSES] } } });

      if (existing?.status === "ATTENDED") throw new DomainError("ALREADY_ATTENDED");
      if (existing?.status === "ENROLLED" || existing?.status === "WAITLISTED") {
        return { status: existing.status, remaining: remainingSeats(campaign.capacity, await occupiedNow()) };
      }

      const occupied = await occupiedNow();
      const status: EnrollmentStatus =
        campaign.capacity > 0 && occupied >= campaign.capacity ? "WAITLISTED" : "ENROLLED";

      await tx.enrollment.upsert({
        where: key,
        create: { volunteerId, campaignId: campaign.id, status },
        update: { status, enrolledAt: new Date() },
      });
      if (status === "ENROLLED") {
        await notify(tx, actor.data.user.id, "ENROLLMENT_CONFIRMED", { campaignTitle: campaign.title }, campaign.id);
      }
      const seatsTaken = status === "ENROLLED" ? occupied + 1 : occupied;
      return { status, remaining: remainingSeats(campaign.capacity, seatsTaken) };
    }, TX_OPTIONS);

    revalidateEnrollment();
    return ok(result);
  });
}

export async function withdraw(campaignId: string): Promise<ActionResult<{ status: "WITHDRAWN" }>> {
  return runAction("withdraw", async () => {
    const actor = await getActor("VOLUNTEER");
    if (!actor.ok) return actor;
    const id = parse(idSchema, campaignId);
    if (!id.ok) return id;

    const key = { volunteerId_campaignId: { volunteerId: actor.data.profile.id, campaignId: id.data } };
    const existing = await prisma.enrollment.findUnique({ where: key, select: { status: true } });
    if (!existing) return fail("NOT_ENROLLED");
    if (existing.status === "ATTENDED") return fail("ALREADY_ATTENDED");
    if (existing.status !== "WITHDRAWN") {
      await prisma.enrollment.update({ where: key, data: { status: "WITHDRAWN" } });
    }

    revalidateEnrollment();
    return ok({ status: "WITHDRAWN" as const });
  });
}
