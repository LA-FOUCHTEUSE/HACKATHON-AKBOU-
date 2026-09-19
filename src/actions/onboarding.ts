"use server";

import { randomBytes } from "node:crypto";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { login } from "@/lib/session";
import { runAction, parse } from "@/lib/action";
import { fail, type ActionResult } from "@/lib/result";
import { isUniqueViolation } from "@/lib/errors";
import { orgSignupSchema, volunteerSignupSchema } from "@/lib/validation";
import { revalidate } from "@/lib/revalidate";

// Placeholder email when the form leaves it empty (User.email is required and unique).
function placeholderEmail(name: string): string {
  const slug =
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.|\.$/g, "")
      .slice(0, 30) || "compte";
  return `${slug}-${randomBytes(3).toString("hex")}@demo.tawa3.dz`;
}

export async function signupVolunteer(input: unknown): Promise<ActionResult<never>> {
  const result = await runAction<{ userId: string }>("signupVolunteer", async () => {
    const parsed = parse(volunteerSignupSchema, input);
    if (!parsed.ok) return parsed;
    const v = parsed.data;
    try {
      const user = await prisma.user.create({
        data: {
          role: "VOLUNTEER",
          email: v.email ?? placeholderEmail(v.fullName),
          displayName: v.fullName,
          volunteer: {
            create: {
              fullName: v.fullName,
              city: v.city,
              birthYear: v.birthYear,
              preferredDomains: v.preferredDomains,
              bio: v.bio,
            },
          },
        },
        select: { id: true },
      });
      return { ok: true, data: { userId: user.id } };
    } catch (e) {
      if (isUniqueViolation(e)) return fail("EMAIL_TAKEN", { fieldErrors: { email: ["errors.EMAIL_TAKEN"] } });
      throw e;
    }
  });
  if (!result.ok) return result;
  await login(result.data.userId);
  revalidate.all();
  return redirect({ href: "/volunteer/feed", locale: await getLocale() });
}

export async function signupOrganization(input: unknown): Promise<ActionResult<never>> {
  const result = await runAction<{ userId: string }>("signupOrganization", async () => {
    const parsed = parse(orgSignupSchema, input);
    if (!parsed.ok) return parsed;
    const o = parsed.data;
    try {
      const user = await prisma.user.create({
        data: {
          role: "ORGANIZATION",
          email: o.email ?? placeholderEmail(o.name),
          displayName: o.name,
          organization: {
            create: {
              name: o.name,
              domains: o.domains,
              description: o.description,
              city: o.city,
              contactPhone: o.contactPhone,
            },
          },
        },
        select: { id: true },
      });
      return { ok: true, data: { userId: user.id } };
    } catch (e) {
      if (isUniqueViolation(e)) return fail("EMAIL_TAKEN", { fieldErrors: { email: ["errors.EMAIL_TAKEN"] } });
      throw e;
    }
  });
  if (!result.ok) return result;
  await login(result.data.userId);
  revalidate.all();
  return redirect({ href: "/org/dashboard", locale: await getLocale() });
}
