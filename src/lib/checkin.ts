import "server-only";
import { randomBytes } from "node:crypto";
import type { EnrollmentStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { DomainError, isUniqueViolation } from "./errors";
import { awardAttendance, alreadyAttendedResult, TX_OPTIONS, type AttendanceResult } from "./points";
import {
  ALLOW_WALK_IN,
  CHECKIN_ELIGIBLE_STATUSES,
  ENROLLABLE_STATUSES,
  TOKEN_REUSE_MIN_REMAINING_MINUTES,
  TOKEN_TTL_MINUTES,
} from "./constants";

const MINUTE = 60_000;

/**
 * Check-in eligibility (docs/ARCHITECTURE.md section 21.5), shared by every attendance path.
 * ENROLLED, WAITLISTED, NO_SHOW -> eligible. ATTENDED -> already. WITHDRAWN or none -> NOT_ENROLLED.
 */
export function checkInEligibility(status: EnrollmentStatus | null | undefined): "eligible" | "already" {
  if (status === "ATTENDED") return "already";
  if (status && (CHECKIN_ELIGIBLE_STATUSES as readonly EnrollmentStatus[]).includes(status)) {
    return "eligible";
  }
  throw new DomainError("NOT_ENROLLED");
}

export function assertCampaignAcceptsCheckIn(status: string): void {
  if (status === "CANCELLED" || status === "DRAFT") throw new DomainError("CAMPAIGN_CLOSED");
}

function randomToken(): string {
  return randomBytes(24).toString("base64url");
}

export interface IssuedToken {
  token: string;
  expiresAt: Date;
}

export async function issueToken(volunteerId: string, campaignId: string): Promise<IssuedToken> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true },
  });
  if (!campaign) throw new DomainError("NOT_FOUND");
  if (!(ENROLLABLE_STATUSES as readonly string[]).includes(campaign.status)) {
    throw new DomainError("CAMPAIGN_CLOSED");
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { volunteerId_campaignId: { volunteerId, campaignId } },
    select: { status: true },
  });
  if (checkInEligibility(enrollment?.status) === "already") throw new DomainError("ALREADY_ATTENDED");

  const now = Date.now();
  const reusable = await prisma.checkInToken.findFirst({
    where: {
      volunteerId,
      campaignId,
      usedAt: null,
      expiresAt: { gt: new Date(now + TOKEN_REUSE_MIN_REMAINING_MINUTES * MINUTE) },
    },
    orderBy: { expiresAt: "desc" },
    select: { token: true, expiresAt: true },
  });
  if (reusable) return reusable;

  return prisma.checkInToken.create({
    data: {
      token: randomToken(),
      volunteerId,
      campaignId,
      expiresAt: new Date(now + TOKEN_TTL_MINUTES * MINUTE),
    },
    select: { token: true, expiresAt: true },
  });
}

/** Validates and consumes a scanned or typed token, then awards attendance. One transaction. */
export async function redeemToken(orgId: string, rawToken: string): Promise<AttendanceResult> {
  const token = rawToken.trim();
  // Filled inside the transaction; used to answer a concurrent duplicate idempotently.
  const ref: { campaign?: { id: string; title: string; pointsValue: number }; volunteerId?: string } = {};

  try {
    return await prisma.$transaction(async (tx) => {
      const found = await tx.checkInToken.findUnique({
        where: { token },
        include: { campaign: { select: { id: true, orgId: true, title: true, pointsValue: true, status: true } } },
      });
      if (!found) throw new DomainError("TOKEN_NOT_FOUND");
      // Ownership first, so another organization learns nothing about the token state.
      if (found.campaign.orgId !== orgId) throw new DomainError("CAMPAIGN_NOT_OWNED");
      if (found.usedAt) throw new DomainError("TOKEN_USED");
      if (found.expiresAt <= new Date()) throw new DomainError("TOKEN_EXPIRED");
      assertCampaignAcceptsCheckIn(found.campaign.status);

      ref.campaign = found.campaign;
      ref.volunteerId = found.volunteerId;

      const enrollment = await tx.enrollment.findUnique({
        where: { volunteerId_campaignId: { volunteerId: found.volunteerId, campaignId: found.campaignId } },
        select: { status: true },
      });
      if (!enrollment && ALLOW_WALK_IN) {
        await tx.enrollment.create({
          data: { volunteerId: found.volunteerId, campaignId: found.campaignId, status: "ENROLLED" },
        });
      } else {
        checkInEligibility(enrollment?.status);
      }

      const claimed = await tx.checkInToken.updateMany({
        where: { id: found.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) throw new DomainError("TOKEN_USED");

      return awardAttendance(found.volunteerId, found.campaign, tx);
    }, TX_OPTIONS);
  } catch (e) {
    if (isUniqueViolation(e) && ref.campaign && ref.volunteerId) {
      return alreadyAttendedResult(prisma, ref.volunteerId, ref.campaign);
    }
    throw e;
  }
}
