import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import { toFailure } from "./errors";
import { fail, ok, type ActionResult } from "./result";
import { fieldErrorsOf } from "./validation";

/** Runs an action body; unexpected errors become a predictable INTERNAL failure. */
export async function runAction<T>(context: string, fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (e) {
    unstable_rethrow(e); // redirect() and notFound() must propagate
    return toFailure<T>(e, context);
  }
}

export function parse<S extends z.ZodType>(schema: S, input: unknown): ActionResult<z.output<S>> {
  const result = schema.safeParse(input);
  if (!result.success) return fail("VALIDATION", { fieldErrors: fieldErrorsOf(result.error) });
  return ok(result.data);
}
