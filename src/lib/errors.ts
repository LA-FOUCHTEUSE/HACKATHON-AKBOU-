import "server-only";
import { Prisma } from "@prisma/client";
import { fail, type ActionResult, type ErrorCode } from "./result";

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly details?: unknown,
  ) {
    super(code);
    this.name = "DomainError";
  }
}

export function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export function toFailure<T = never>(e: unknown, context: string): ActionResult<T> {
  if (e instanceof DomainError) {
    return fail(e.code, e.details === undefined ? undefined : { details: e.details });
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
    return fail("NOT_FOUND");
  }
  console.error(`[${context}]`, e);
  return fail("INTERNAL");
}

export const HTTP_STATUS: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  VALIDATION: 400,
  NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  CAMPAIGN_CLOSED: 409,
  ALREADY_ATTENDED: 409,
  NOT_ENROLLED: 409,
  VOLUNTEER_NOT_FOUND: 404,
  AMBIGUOUS_NAME: 409,
  TOKEN_NOT_FOUND: 404,
  TOKEN_USED: 409,
  TOKEN_EXPIRED: 410,
  CAMPAIGN_NOT_OWNED: 403,
  CARD_NOT_FOUND: 404,
  PAYMENT_FAILED: 402,
  INTERNAL: 500,
};
