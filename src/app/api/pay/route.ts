import { NextResponse } from "next/server";
import { getActor, getCurrentUser } from "@/lib/session";
import { fieldErrorsOf, payRequestSchema } from "@/lib/validation";
import { processDonation, processSponsorship, type PaymentOutcome } from "@/lib/contributions";
import { HTTP_STATUS, toFailure } from "@/lib/errors";
import type { ActionResult } from "@/lib/result";
import { revalidate } from "@/lib/revalidate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function respond(body: ActionResult<PaymentOutcome>) {
  const status = body.ok ? 200 : HTTP_STATUS[body.error.code];
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Mock payment endpoint (spec section 9). SPONSORSHIP requires a sponsor session, DONATION is public.
 * Same library functions as the Server Actions, so there is a single payment path.
 * Unknown fields (for example a card number) are stripped by Zod and never read.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return respond({ ok: false, error: { code: "VALIDATION" } });
  }
  const parsed = payRequestSchema.safeParse(body);
  if (!parsed.success) {
    return respond({ ok: false, error: { code: "VALIDATION", fieldErrors: fieldErrorsOf(parsed.error) } });
  }
  const input = parsed.data;

  try {
    let outcome: PaymentOutcome;
    if (input.kind === "SPONSORSHIP") {
      const actor = await getActor("SPONSOR");
      if (!actor.ok) return respond(actor);
      outcome = await processSponsorship(actor.data.profile, actor.data.user.id, input);
    } else {
      outcome = await processDonation(await getCurrentUser(), input);
    }
    revalidate.caisse();
    return respond({ ok: true, data: outcome });
  } catch (e) {
    return respond(toFailure<PaymentOutcome>(e, "api/pay"));
  }
}
