export const ERROR_CODES = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "VALIDATION",
  "NOT_FOUND",
  "EMAIL_TAKEN",
  "CAMPAIGN_CLOSED",
  "ALREADY_ATTENDED",
  "NOT_ENROLLED",
  "VOLUNTEER_NOT_FOUND",
  "AMBIGUOUS_NAME",
  "TOKEN_NOT_FOUND",
  "TOKEN_USED",
  "TOKEN_EXPIRED",
  "CAMPAIGN_NOT_OWNED",
  "CARD_NOT_FOUND",
  "PAYMENT_FAILED",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ActionError {
  code: ErrorCode;
  fieldErrors?: Record<string, string[] | undefined>;
  details?: unknown;
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(code: ErrorCode, extra?: Omit<ActionError, "code">): ActionResult<T> {
  return { ok: false, error: { code, ...extra } };
}
