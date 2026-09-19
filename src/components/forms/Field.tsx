"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";

/** Label + control + translated error. Error messages are i18n keys from lib/validation.ts. */
export function Field({
  id,
  label,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {optional ? <span className="font-normal text-muted-foreground"> ({t("common.optional")})</span> : null}
      </Label>
      {children}
      {error ? <p className="text-sm text-destructive">{t.has(error) ? t(error) : error}</p> : null}
    </div>
  );
}

export function FormError({ code }: { code: string | null }) {
  const t = useTranslations("errors");
  if (!code) return null;
  return <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{t(code)}</p>;
}
