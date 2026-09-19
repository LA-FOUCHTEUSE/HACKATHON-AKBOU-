import type { SponsorTier } from "@prisma/client";
import { useFormatter, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface PackData {
  tier: SponsorTier;
  priceDZD: number;
  benefitKeys: string[];
}

/** Sponsorship pack with its benefits, rendered from i18n keys (no translated text is stored). */
export function PackCard({ pack }: { pack: PackData }) {
  const t = useTranslations();
  const format = useFormatter();
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-base">{t(`packs.${pack.tier}.name`)}</CardTitle>
        <p className="text-xl font-bold text-primary">{format.number(pack.priceDZD, "dzd")}</p>
      </CardHeader>
      <CardContent className="px-4">
        <ul className="space-y-1.5 text-sm">
          {pack.benefitKeys.map((key) => (
            <li key={key} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              {t(key)}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
