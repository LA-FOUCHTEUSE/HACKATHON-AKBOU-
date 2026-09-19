import "server-only";
import type { SponsorTier } from "@prisma/client";
import { prisma } from "./prisma";
import { DomainError } from "./errors";
import { payments, type ChargeResult } from "./payments";
import { notify } from "./notifications";
import { TX_OPTIONS } from "./points";
import { ENROLLABLE_STATUSES } from "./constants";
import type { SessionUser } from "./session";

export interface PaymentOutcome {
  kind: "SPONSORSHIP" | "DONATION";
  /** sponsorshipId or donationId */
  reference: string;
  status: "CONFIRMED";
  amountDZD: number;
  transactionId: string;
}

async function loadOpenCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, title: true, status: true, org: { select: { userId: true } } },
  });
  if (!campaign) throw new DomainError("NOT_FOUND");
  if (!(ENROLLABLE_STATUSES as readonly string[]).includes(campaign.status)) {
    throw new DomainError("CAMPAIGN_CLOSED");
  }
  return campaign;
}

/** A provider failure or crash must leave the row FAILED, never stuck PENDING with a confirmed charge. */
async function charge(
  input: Parameters<typeof payments.charge>[0],
  onFailed: () => Promise<unknown>,
): Promise<ChargeResult> {
  let result: ChargeResult;
  try {
    result = await payments.charge(input);
  } catch (e) {
    await onFailed();
    throw e;
  }
  if (result.status !== "CONFIRMED") {
    await onFailed();
    throw new DomainError("PAYMENT_FAILED");
  }
  return result;
}

/**
 * Sponsorship checkout (spec 7.3.C). The amount comes from the SponsorshipPack, never from the client.
 * The PENDING row is written first, the mock charge runs outside any transaction (no DB connection is
 * held during the delay), then CONFIRMED + the organization notification are written atomically.
 */
export async function processSponsorship(
  sponsor: { id: string; companyName: string },
  userId: string,
  input: { campaignId: string; tier: SponsorTier; cardId: string },
): Promise<PaymentOutcome> {
  const campaign = await loadOpenCampaign(input.campaignId);
  const pack = await prisma.sponsorshipPack.findUnique({ where: { tier: input.tier } });
  if (!pack) throw new DomainError("NOT_FOUND");
  // The card must belong to the paying user.
  const card = await prisma.savedCard.findFirst({
    where: { id: input.cardId, userId },
    select: { last4: true, holderName: true },
  });
  if (!card) throw new DomainError("CARD_NOT_FOUND");

  const sponsorship = await prisma.sponsorship.create({
    data: {
      sponsorId: sponsor.id,
      campaignId: campaign.id,
      tier: pack.tier,
      amountDZD: pack.priceDZD,
      status: "PENDING",
    },
    select: { id: true },
  });
  const markFailed = () =>
    prisma.sponsorship.update({ where: { id: sponsorship.id }, data: { status: "FAILED" } });

  const result = await charge(
    { amountDZD: pack.priceDZD, reference: sponsorship.id, card },
    markFailed,
  );

  await prisma.$transaction(async (tx) => {
    await tx.sponsorship.update({ where: { id: sponsorship.id }, data: { status: "CONFIRMED" } });
    await notify(
      tx,
      campaign.org.userId,
      "SPONSOR_CONFIRMED",
      {
        campaignTitle: campaign.title,
        companyName: sponsor.companyName,
        tierKey: `packs.${pack.tier}.name`,
        amount: pack.priceDZD,
      },
      campaign.id,
    );
  }, TX_OPTIONS);

  return {
    kind: "SPONSORSHIP",
    reference: sponsorship.id,
    status: "CONFIRMED",
    amountDZD: pack.priceDZD,
    transactionId: result.transactionId,
  };
}

/**
 * Individual donation (spec 7.3, "Individual donations"). Donors need no account.
 * Card: the logged-in user's first saved card when there is one, otherwise a mock card built from the
 * donor name (the mock provider ignores it; there is no card input, so no card data is ever collected).
 */
export async function processDonation(
  user: SessionUser | null,
  input: { campaignId: string; donorName: string; amountDZD: number },
): Promise<PaymentOutcome> {
  const campaign = await loadOpenCampaign(input.campaignId);
  const saved = user
    ? await prisma.savedCard.findFirst({
        where: { userId: user.id },
        orderBy: { id: "asc" },
        select: { last4: true, holderName: true },
      })
    : null;
  const card = saved ?? { last4: "0000", holderName: input.donorName };

  const donation = await prisma.donation.create({
    data: {
      campaignId: campaign.id,
      donorName: input.donorName,
      amountDZD: input.amountDZD,
      method: "EDAHABIA_MOCK",
      status: "PENDING",
    },
    select: { id: true },
  });
  const markFailed = () => prisma.donation.update({ where: { id: donation.id }, data: { status: "FAILED" } });

  const result = await charge({ amountDZD: input.amountDZD, reference: donation.id, card }, markFailed);

  await prisma.$transaction(async (tx) => {
    await tx.donation.update({ where: { id: donation.id }, data: { status: "CONFIRMED" } });
    await notify(
      tx,
      campaign.org.userId,
      "DONATION_RECEIVED",
      { campaignTitle: campaign.title, donorName: input.donorName, amount: input.amountDZD },
      campaign.id,
    );
  }, TX_OPTIONS);

  return {
    kind: "DONATION",
    reference: donation.id,
    status: "CONFIRMED",
    amountDZD: input.amountDZD,
    transactionId: result.transactionId,
  };
}
