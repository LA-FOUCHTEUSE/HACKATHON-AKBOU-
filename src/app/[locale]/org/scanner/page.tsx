import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/session";
import { QrScanner } from "@/components/org/QrScanner";

export const dynamic = "force-dynamic";

// Server gate (organization only) around the client-side camera scanner (ARCHITECTURE.md, C4).
export default async function ScannerPage() {
  await requireRole("ORGANIZATION");
  const t = await getTranslations("scanner");
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("instructions")}</p>
      </div>
      <QrScanner />
    </div>
  );
}
