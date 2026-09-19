"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

const LABELS: Record<AppLocale, string> = { fr: "FR", en: "EN", ar: "العربية" };

export function LanguageSwitcher({ label }: { label: string }) {
  const locale = useLocale();
  const router = useRouter();
  // Current path without the locale prefix, so the same page is shown in the new language.
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-1 text-sm">
      <span className="sr-only">{label}</span>
      <select
        className="rounded-md border bg-background px-2 py-1 text-sm"
        value={locale}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as AppLocale;
          startTransition(() => router.replace(pathname, { locale: next }));
        }}
      >
        {routing.locales.map((l) => (
          <option key={l} value={l}>
            {LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
