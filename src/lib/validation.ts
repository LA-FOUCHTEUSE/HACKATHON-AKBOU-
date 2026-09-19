import { z } from "zod";
import { ACTIVITY_DOMAINS } from "./domains";
import { SPONSOR_TIERS } from "./constants";

// Error messages are i18n keys under "validation.*", translated by the client.
const req = { error: "validation.required" };

export const idSchema = z.string(req).min(1, "validation.required").max(64, "validation.invalid");

const trimmed = (min: number, max: number) =>
  z
    .string(req)
    .trim()
    .min(min, "validation.tooShort")
    .max(max, "validation.tooLong");

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "validation.tooLong")
    .optional()
    .transform((v) => (v ? v : undefined));

const domainSchema = z.enum(ACTIVITY_DOMAINS, { error: "validation.invalid" });

const domainList = z
  .array(domainSchema)
  .min(1, "validation.pickDomain")
  .max(5, "validation.tooMany")
  .transform((list) => Array.from(new Set(list)));

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .transform((v) => (v ? v : undefined))
  .pipe(z.email("validation.email").optional());

export const checkInTokenSchema = z.object({
  token: z.string(req).trim().min(8, "validation.invalid").max(128, "validation.invalid"),
});

const currentYear = new Date().getFullYear();

export const volunteerSignupSchema = z.object({
  fullName: trimmed(2, 80),
  email: optionalEmail,
  city: optionalTrimmed(60),
  birthYear: z.coerce
    .number({ error: "validation.invalid" })
    .int("validation.invalid")
    .min(1930, "validation.invalid")
    .max(currentYear - 12, "validation.invalid")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  preferredDomains: domainList,
  bio: optionalTrimmed(500),
});
export type VolunteerSignupInput = z.input<typeof volunteerSignupSchema>;

export const orgSignupSchema = z.object({
  name: trimmed(2, 100),
  email: optionalEmail,
  domains: domainList,
  description: optionalTrimmed(1000).refine((v) => !v || v.length >= 10, "validation.tooShort"),
  city: optionalTrimmed(60),
  contactPhone: optionalTrimmed(20).refine(
    (v) => !v || /^(\+213|0)[0-9 ]{8,12}$/.test(v),
    "validation.phone",
  ),
});
export type OrgSignupInput = z.input<typeof orgSignupSchema>;

const campaignBase = z.object({
  title: trimmed(3, 120),
  description: trimmed(10, 4000),
  domain: domainSchema,
  city: optionalTrimmed(60),
  location: optionalTrimmed(160),
  startAt: z.coerce.date({ error: "validation.date" }),
  endAt: z.coerce.date({ error: "validation.date" }),
  capacity: z.coerce.number({ error: "validation.invalid" }).int("validation.invalid").min(0, "validation.invalid").max(10000, "validation.invalid"),
  pointsValue: z.coerce.number({ error: "validation.invalid" }).int("validation.invalid").min(0, "validation.invalid").max(1000, "validation.invalid"),
  needsFunding: z.boolean().default(false),
  fundingGoal: z.coerce
    .number({ error: "validation.invalid" })
    .int("validation.invalid")
    .min(1000, "validation.invalid")
    .max(100_000_000, "validation.invalid")
    .optional()
    .or(z.literal("").transform(() => undefined))
    .or(z.null().transform(() => undefined)),
  sponsorRequested: z.boolean().default(false),
});

type CampaignBase = z.output<typeof campaignBase>;

function campaignRules(v: CampaignBase, ctx: z.RefinementCtx) {
  if (v.endAt <= v.startAt) {
    ctx.addIssue({ code: "custom", path: ["endAt"], message: "validation.endBeforeStart" });
  }
  if (v.needsFunding && !v.fundingGoal) {
    ctx.addIssue({ code: "custom", path: ["fundingGoal"], message: "validation.required" });
  }
}

export const campaignCreateSchema = campaignBase
  .extend({ status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED") })
  .superRefine(campaignRules);
export type CampaignCreateInput = z.input<typeof campaignCreateSchema>;

export const campaignUpdateSchema = campaignBase
  .extend({ status: z.enum(["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED"]) })
  .superRefine(campaignRules);
export type CampaignUpdateInput = z.input<typeof campaignUpdateSchema>;

export const addParticipantSchema = z.object({
  campaignId: idSchema,
  volunteerName: trimmed(2, 80),
});

export const enrollmentIdSchema = z.object({ enrollmentId: idSchema });

export const sponsorshipSchema = z.object({
  campaignId: idSchema,
  tier: z.enum(SPONSOR_TIERS, { error: "validation.invalid" }),
  cardId: idSchema,
});

export const donationSchema = z.object({
  campaignId: idSchema,
  donorName: trimmed(2, 80),
  amountDZD: z.coerce.number({ error: "validation.invalid" }).int("validation.invalid").min(100, "validation.amountMin").max(1_000_000, "validation.amountMax"),
});

export const payRequestSchema = z.discriminatedUnion(
  "kind",
  [
    sponsorshipSchema.extend({ kind: z.literal("SPONSORSHIP") }),
    donationSchema.extend({ kind: z.literal("DONATION") }),
  ],
  { error: "validation.invalid" },
);

export function fieldErrorsOf(error: z.ZodError): Record<string, string[] | undefined> {
  return z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
}
