"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { runAction, parse } from "@/lib/action";
import { fail, ok, type ActionResult } from "@/lib/result";
import { idSchema } from "@/lib/validation";
import { revalidate } from "@/lib/revalidate";

export async function markRead(id: string): Promise<ActionResult<{ updated: number }>> {
  return runAction("markRead", async () => {
    const user = await getCurrentUser();
    if (!user) return fail("UNAUTHENTICATED");
    const parsed = parse(idSchema, id);
    if (!parsed.ok) return parsed;
    // Ownership enforced in the WHERE clause.
    const { count } = await prisma.notification.updateMany({
      where: { id: parsed.data, userId: user.id },
      data: { read: true },
    });
    revalidate.inbox();
    return ok({ updated: count });
  });
}

export async function markAllRead(): Promise<ActionResult<{ updated: number }>> {
  return runAction("markAllRead", async () => {
    const user = await getCurrentUser();
    if (!user) return fail("UNAUTHENTICATED");
    const { count } = await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    revalidate.inbox();
    return ok({ updated: count });
  });
}
