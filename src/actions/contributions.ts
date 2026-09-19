"use server";

import { getActor, getCurrentUser } from "@/lib/session";
import { runAction, parse } from "@/lib/action";
import { ok, type ActionResult } from "@/lib/result";
import { donationSchema, sponsorshipSchema } from "@/lib/validation";
import { processDonation, processSponsorship } from "@/lib/contributions";
import { revalidate } from "@/lib/revalidate";

export interface ContributionResult {
  status: "CONFIRMED";
  amountDZD: number;
  transactionId: string;
}

export async function purchaseSponsorship(
  input: unknown,
): Promise<ActionResult<ContributionResult & { sponsorshipId: string }>> {
  return runAction("purchaseSponsorship", async () => {
    const actor = await getActor("SPONSOR");
    if (!actor.ok) return actor;
    const parsed = parse(sponsorshipSchema, input);
    if (!parsed.ok) return parsed;

    const outcome = await processSponsorship(actor.data.profile, actor.data.user.id, parsed.data);

    revalidate.caisse();
    return ok({
      sponsorshipId: outcome.reference,
      status: outcome.status,
      amountDZD: outcome.amountDZD,
      transactionId: outcome.transactionId,
    });
  });
}

export async function donate(input: unknown): Promise<ActionResult<ContributionResult & { donationId: string }>> {
  return runAction("donate", async () => {
    const parsed = parse(donationSchema, input);
    if (!parsed.ok) return parsed;
    // Public action: a logged-in user only influences which saved card the mock charge shows.
    const user = await getCurrentUser();

    const outcome = await processDonation(user, parsed.data);

    revalidate.caisse();
    return ok({
      donationId: outcome.reference,
      status: outcome.status,
      amountDZD: outcome.amountDZD,
      transactionId: outcome.transactionId,
    });
  });
}
