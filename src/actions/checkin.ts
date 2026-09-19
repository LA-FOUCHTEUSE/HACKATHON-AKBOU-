"use server";

import { getActor } from "@/lib/session";
import { runAction, parse } from "@/lib/action";
import { ok, type ActionResult } from "@/lib/result";
import { idSchema } from "@/lib/validation";
import { issueToken } from "@/lib/checkin";

/** Volunteer side of the QR flow: returns the opaque token string to render as a QR code. */
export async function issueCheckInToken(
  campaignId: string,
): Promise<ActionResult<{ token: string; expiresAt: string }>> {
  return runAction("issueCheckInToken", async () => {
    const actor = await getActor("VOLUNTEER");
    if (!actor.ok) return actor;
    const id = parse(idSchema, campaignId);
    if (!id.ok) return id;
    const issued = await issueToken(actor.data.profile.id, id.data);
    return ok({ token: issued.token, expiresAt: issued.expiresAt.toISOString() });
  });
}
