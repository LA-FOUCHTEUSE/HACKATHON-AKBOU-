import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getLocale } from "next-intl/server";
import type { OrganizationProfile, Role, SponsorProfile, User, VolunteerProfile } from "@prisma/client";
import { prisma } from "./prisma";
import { redirect } from "@/i18n/navigation";
import { fail, ok, type ActionResult } from "./result";

const COOKIE_NAME = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = User & {
  volunteer: VolunteerProfile | null;
  organization: OrganizationProfile | null;
  sponsor: SponsorProfile | null;
};

type ProfileOf = {
  VOLUNTEER: VolunteerProfile;
  ORGANIZATION: OrganizationProfile;
  SPONSOR: SponsorProfile;
};

export type RoleActor<R extends Role> = { user: SessionUser; profile: ProfileOf[R] };

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long");
  }
  return s;
}

function sign(userId: string): string {
  return createHmac("sha256", secret()).update(userId).digest("base64url");
}

function verify(value: string): string | null {
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(sign(userId));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return userId;
}

/** Sets the signed session cookie. Only callable from Server Actions and Route Handlers. */
export async function login(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return false;
  const store = await cookies();
  store.set(COOKIE_NAME, `${user.id}.${sign(user.id)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return true;
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const userId = verify(raw);
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    include: { volunteer: true, organization: true, sponsor: true },
  });
});

function profileFor<R extends Role>(user: SessionUser, role: R): ProfileOf[R] | null {
  if (user.role !== role) return null;
  const profile =
    role === "VOLUNTEER" ? user.volunteer : role === "ORGANIZATION" ? user.organization : user.sponsor;
  return (profile ?? null) as ProfileOf[R] | null;
}

/** For pages: redirects to /login when the visitor is not logged in with `role`. */
export async function requireRole<R extends Role>(role: R): Promise<RoleActor<R>> {
  const user = await getCurrentUser();
  const profile = user ? profileFor(user, role) : null;
  if (!user || !profile) {
    const locale = await getLocale();
    return redirect({ href: "/login", locale });
  }
  return { user, profile };
}

/** For Server Actions and Route Handlers: returns a failure instead of redirecting. */
export async function getActor<R extends Role>(role: R): Promise<ActionResult<RoleActor<R>>> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");
  const profile = profileFor(user, role);
  if (!profile) return fail("FORBIDDEN");
  return ok({ user, profile });
}
