import type { ActivityDomain } from "@prisma/client";
import { useTranslations } from "next-intl";
import { DOMAIN_COLORS } from "@/lib/domains";
import { cn } from "@/lib/utils";

export function DomainBadge({ domain, className }: { domain: ActivityDomain; className?: string }) {
  const t = useTranslations("domains");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white",
        DOMAIN_COLORS[domain],
        className,
      )}
    >
      {t(domain)}
    </span>
  );
}
