"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { login, logout } from "@/lib/session";
import { idSchema } from "@/lib/validation";
import { ROLE_HOME } from "@/lib/constants";
import { revalidate } from "@/lib/revalidate";

/** Quick login (demo-grade, spec section 6). Used as a form action with a bound user id. */
export async function loginAs(userId: string): Promise<void> {
  const locale = await getLocale();
  const parsed = idSchema.safeParse(userId);
  const user = parsed.success
    ? await prisma.user.findUnique({ where: { id: parsed.data }, select: { id: true, role: true } })
    : null;
  if (!user || !(await login(user.id))) {
    return redirect({ href: "/login", locale });
  }
  revalidate.all();
  return redirect({ href: ROLE_HOME[user.role], locale });
}

export async function logoutAction(): Promise<void> {
  const locale = await getLocale();
  await logout();
  revalidate.all();
  return redirect({ href: "/", locale });
}
