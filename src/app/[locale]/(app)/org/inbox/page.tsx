import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/session";
import { InboxList } from "@/components/notifications/InboxList";

export const dynamic = "force-dynamic";

export default async function OrgInboxPage() {
  const { user } = await requireRole("ORGANIZATION");
  const t = await getTranslations("inbox");
  return (
    <div className="space-y-4">
      <h1 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]">{t("title")}</h1>
      <InboxList userId={user.id} />
    </div>
  );
}
