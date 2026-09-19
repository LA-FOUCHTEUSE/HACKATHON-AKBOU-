"use server";

import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/session";
import { runAction, parse } from "@/lib/action";
import { fail, ok, type ActionResult } from "@/lib/result";
import { DomainError } from "@/lib/errors";
import { addParticipantSchema, enrollmentIdSchema } from "@/lib/validation";
import { notify } from "@/lib/notifications";
import { findVolunteersByName } from "@/lib/volunteers";
import { awardAttendance, TX_OPTIONS, type AttendanceResult } from "@/lib/points";
import { assertCampaignAcceptsCheckIn, checkInEligibility } from "@/lib/checkin";
import { revalidate } from "@/lib/revalidate";

function revalidateParticipants() {
  revalidate.orgCampaign();
  revalidate.feeds();
  revalidate.volunteerProfile();
  revalidate.inbox();
}

async function ownedEnrollment(enrollmentId: string, orgId: string) {
  return prisma.enrollment.findFirst({
    where: { id: enrollmentId, campaign: { orgId } },
    select: {
      id: true,
      status: true,
      volunteerId: true,
      campaign: { select: { id: true, title: true, pointsValue: true, status: true } },
    },
  });
}

export async function addParticipantByName(
  campaignId: string,
  volunteerName: string,
): Promise<ActionResult<{ enrollmentId: string; volunteerName: string }>> {
  return runAction("addParticipantByName", async () => {
    const actor = await getActor("ORGANIZATION");
    if (!actor.ok) return actor;
    const parsed = parse(addParticipantSchema, { campaignId, volunteerName });
    if (!parsed.ok) return parsed;

    const campaign = await prisma.campaign.findFirst({
      where: { id: parsed.data.campaignId, orgId: actor.data.profile.id },
      select: { id: true, title: true, status: true },
    });
    if (!campaign) return fail("NOT_FOUND");
    if (campaign.status === "CANCELLED") return fail("CAMPAIGN_CLOSED");

    const matches = await findVolunteersByName(parsed.data.volunteerName);
    if (matches.length === 0) return fail("VOLUNTEER_NOT_FOUND");
    if (matches.length > 1) {
      return fail("AMBIGUOUS_NAME", {
        details: { candidates: matches.map((m) => ({ fullName: m.fullName, city: m.city })) },
      });
    }
    const volunteer = matches[0];

    // The organizer adding someone by hand overrides capacity (ARCHITECTURE.md, A9).
    const enrollment = await prisma.$transaction(async (tx) => {
      const key = { volunteerId_campaignId: { volunteerId: volunteer.id, campaignId: campaign.id } };
      const existing = await tx.enrollment.findUnique({ where: key, select: { status: true } });
      if (existing?.status === "ATTENDED") throw new DomainError("ALREADY_ATTENDED");
      const row = await tx.enrollment.upsert({
        where: key,
        create: { volunteerId: volunteer.id, campaignId: campaign.id, status: "ENROLLED" },
        update: { status: "ENROLLED" },
        select: { id: true },
      });
      if (existing?.status !== "ENROLLED") {
        await notify(tx, volunteer.userId, "ENROLLMENT_CONFIRMED", { campaignTitle: campaign.title }, campaign.id);
      }
      return row;
    }, TX_OPTIONS);

    revalidateParticipants();
    return ok({ enrollmentId: enrollment.id, volunteerName: volunteer.fullName });
  });
}

export async function removeParticipant(enrollmentId: string): Promise<ActionResult<{ enrollmentId: string }>> {
  return runAction("removeParticipant", async () => {
    const actor = await getActor("ORGANIZATION");
    if (!actor.ok) return actor;
    const parsed = parse(enrollmentIdSchema, { enrollmentId });
    if (!parsed.ok) return parsed;

    const enrollment = await ownedEnrollment(parsed.data.enrollmentId, actor.data.profile.id);
    if (!enrollment) return fail("NOT_FOUND");
    if (enrollment.status === "ATTENDED") return fail("ALREADY_ATTENDED");
    if (enrollment.status !== "WITHDRAWN") {
      await prisma.enrollment.update({ where: { id: enrollment.id }, data: { status: "WITHDRAWN" } });
    }

    revalidateParticipants();
    return ok({ enrollmentId: enrollment.id });
  });
}

/** QR fallback (spec 7.2.D): runs exactly the same awardAttendance engine as a scan. */
export async function markAttendedManually(enrollmentId: string): Promise<ActionResult<AttendanceResult>> {
  return runAction("markAttendedManually", async () => {
    const actor = await getActor("ORGANIZATION");
    if (!actor.ok) return actor;
    const parsed = parse(enrollmentIdSchema, { enrollmentId });
    if (!parsed.ok) return parsed;

    const enrollment = await ownedEnrollment(parsed.data.enrollmentId, actor.data.profile.id);
    if (!enrollment) return fail("NOT_FOUND");
    assertCampaignAcceptsCheckIn(enrollment.campaign.status);
    checkInEligibility(enrollment.status); // same eligibility rule as the QR path

    const result = await awardAttendance(enrollment.volunteerId, enrollment.campaign);

    revalidate.attendance();
    return ok(result);
  });
}
