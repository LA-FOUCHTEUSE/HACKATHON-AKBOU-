"use client";

import type { ActivityDomain } from "@prisma/client";
import { useTranslations } from "next-intl";
import { ACTIVITY_DOMAINS } from "@/lib/domains";
import { cn } from "@/lib/utils";

export function DomainPicker({
  value,
  onChange,
  id,
}: {
  value: ActivityDomain[];
  onChange: (next: ActivityDomain[]) => void;
  id?: string;
}) {
  const t = useTranslations("domains");
  return (
    <div id={id} className="flex flex-wrap gap-2" role="group">
      {ACTIVITY_DOMAINS.map((d) => {
        const selected = value.includes(d);
        return (
          <button
            key={d}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? value.filter((x) => x !== d) : [...value, d])}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {t(d)}
          </button>
        );
      })}
    </div>
  );
}
