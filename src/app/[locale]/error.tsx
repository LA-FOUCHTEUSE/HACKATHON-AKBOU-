"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("common");
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <p className="text-lg font-semibold">{t("unexpectedError")}</p>
      <Button onClick={reset}>{t("retry")}</Button>
    </div>
  );
}
