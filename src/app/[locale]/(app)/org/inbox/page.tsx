import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/session";
import { InboxList } from "@/components/notifications/InboxList";

export const dynamic = "force-dynamic";

export default async function OrgInboxPage() {
  const { user } = await requireRole("ORGANIZATION");
  const t = await getTranslations("inbox");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <InboxList userId={user.id} />
    </div>
  );
}
