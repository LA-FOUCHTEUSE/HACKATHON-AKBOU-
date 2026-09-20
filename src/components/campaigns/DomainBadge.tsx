import type { ActivityDomain } from "@prisma/client";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Domain is a label, not an account type, so it stays neutral: red and green are
 * reserved for volunteer and organization throughout the product.
 */
export function DomainBadge({ domain, className }: { domain: ActivityDomain; className?: string }) {
  const t = useTranslations("domains");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-hairline px-3 py-1 text-[0.6875rem] uppercase tracking-[0.12em] text-ink-muted",
        className,
      )}
    >
      {t(domain)}
    </span>
  );
}
