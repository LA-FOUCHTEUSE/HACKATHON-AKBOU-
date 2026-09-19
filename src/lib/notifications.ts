import "server-only";
import type { NotificationType, Prisma } from "@prisma/client";

// Notifications store i18n keys and params only, never translated text.
// Params whose name ends in "Key" hold an i18n key and are translated before interpolation.
export const NOTIFICATION_KEYS: Record<NotificationType, string> = {
  CAMPAIGN_RECOMMENDATION: "notifications.recommendation",
  CAMPAIGN_CANCELLED: "notifications.cancelled",
  CAMPAIGN_REMINDER: "notifications.reminder",
  ENROLLMENT_CONFIRMED: "notifications.enrollmentConfirmed",
  POINTS_AWARDED: "notifications.pointsAwarded",
  RANK_UP: "notifications.rankUp",
  SPONSOR_CONFIRMED: "notifications.sponsorConfirmed",
  DONATION_RECEIVED: "notifications.donationReceived",
};

export type NotificationParams = Record<string, string | number>;

export function notificationData(
  userId: string,
  type: NotificationType,
  params?: NotificationParams,
  campaignId?: string,
): Prisma.NotificationCreateManyInput {
  const prefix = NOTIFICATION_KEYS[type];
  return {
    userId,
    type,
    titleKey: `${prefix}.title`,
    bodyKey: `${prefix}.body`,
    params: params ?? undefined,
    campaignId: campaignId ?? null,
  };
}

export async function notify(
  db: Prisma.TransactionClient,
  userId: string,
  type: NotificationType,
  params?: NotificationParams,
  campaignId?: string,
): Promise<void> {
  await db.notification.create({ data: notificationData(userId, type, params, campaignId) });
}

export async function notifyMany(
  db: Prisma.TransactionClient,
  userIds: string[],
  type: NotificationType,
  params?: NotificationParams,
  campaignId?: string,
): Promise<number> {
  if (userIds.length === 0) return 0;
  const result = await db.notification.createMany({
    data: userIds.map((userId) => notificationData(userId, type, params, campaignId)),
  });
  return result.count;
}
