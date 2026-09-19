import { NextResponse } from "next/server";
import { getActor } from "@/lib/session";
import { checkInTokenSchema, fieldErrorsOf } from "@/lib/validation";
import { redeemToken } from "@/lib/checkin";
import { HTTP_STATUS, toFailure } from "@/lib/errors";
import type { ActionResult } from "@/lib/result";
import type { AttendanceResult } from "@/lib/points";
import { revalidate } from "@/lib/revalidate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function respond(body: ActionResult<AttendanceResult>) {
  const status = body.ok ? 200 : HTTP_STATUS[body.error.code];
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** POST { token } from the org scanner (camera or manual entry). Spec section 10. */
export async function POST(req: Request) {
  const actor = await getActor("ORGANIZATION");
  if (!actor.ok) return respond(actor);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return respond({ ok: false, error: { code: "VALIDATION" } });
  }
  const parsed = checkInTokenSchema.safeParse(body);
  if (!parsed.success) {
    return respond({ ok: false, error: { code: "VALIDATION", fieldErrors: fieldErrorsOf(parsed.error) } });
  }

  try {
    const result = await redeemToken(actor.data.profile.id, parsed.data.token);
    revalidate.attendance();
    return respond({ ok: true, data: result });
  } catch (e) {
    return respond(toFailure<AttendanceResult>(e, "api/checkin"));
  }
}
