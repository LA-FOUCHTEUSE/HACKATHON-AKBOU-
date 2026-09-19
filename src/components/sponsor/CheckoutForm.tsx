"use client";

import { useState, useTransition } from "react";
import type { SponsorTier } from "@prisma/client";
import { useFormatter, useTranslations } from "next-intl";
import { CheckCircle2, CreditCard } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { purchaseSponsorship, type ContributionResult } from "@/actions/contributions";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/forms/Field";
import { cn } from "@/lib/utils";
import type { PackData } from "./PackCard";

export interface SavedCardData {
  id: string;
  holderName: string;
  last4: string;
  brand: string;
}

/**
 * Sponsor checkout: pick a pack, pick a pre-saved (mock) card, confirm.
 * No card number is ever typed or sent: only the saved card id.
 */
export function CheckoutForm({
  campaignId,
  packs,
  cards,
  defaultTier = "PRO",
}: {
  campaignId: string;
  packs: PackData[];
  cards: SavedCardData[];
  defaultTier?: SponsorTier;
}) {
  const t = useTranslations();
  const format = useFormatter();
  const [tier, setTier] = useState<SponsorTier>(packs.some((p) => p.tier === defaultTier) ? defaultTier : packs[0].tier);
  const [cardId, setCardId] = useState(cards[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<(ContributionResult & { tier: SponsorTier }) | null>(null);

  if (done) {
    return (
      <div className="space-y-3 rounded-xl border-2 border-primary bg-primary/5 p-5 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <p className="text-lg font-semibold">{t("sponsor.success")}</p>
        <p>
          {t(`packs.${done.tier}.name`)} - {format.number(done.amountDZD, "dzd")}
        </p>
        <p className="font-mono text-xs break-all text-muted-foreground" dir="ltr">
          {t("sponsor.transaction", { id: done.transactionId })}
        </p>
        <Button asChild variant="secondary">
          <Link href="/sponsor/browse">{t("sponsor.backToBrowse")}</Link>
        </Button>
      </div>
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await purchaseSponsorship({ campaignId, tier, cardId });
      if (result.ok) setDone({ ...result.data, tier });
      else setError(result.error.code);
    });
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <FormError code={error} />

      <fieldset className="space-y-2">
        <legend className="mb-2 font-semibold">{t("sponsor.chooseTier")}</legend>
        {packs.map((pack) => (
          <label
            key={pack.tier}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-3",
              tier === pack.tier && "border-primary bg-primary/5",
            )}
          >
            <input
              type="radio"
              name="tier"
              className="size-4"
              checked={tier === pack.tier}
              onChange={() => setTier(pack.tier)}
            />
            <span className="flex-1 font-medium">{t(`packs.${pack.tier}.name`)}</span>
            <span className="font-semibold">{format.number(pack.priceDZD, "dzd")}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 font-semibold">{t("sponsor.chooseCard")}</legend>
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("sponsor.noCard")}</p>
        ) : (
          cards.map((card) => (
            <label
              key={card.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3",
                cardId === card.id && "border-primary bg-primary/5",
              )}
            >
              <input
                type="radio"
                name="card"
                className="size-4"
                checked={cardId === card.id}
                onChange={() => setCardId(card.id)}
              />
              <CreditCard className="size-4 text-muted-foreground" />
              <span className="flex-1">
                <span className="block font-medium">{t("sponsor.card", { brand: card.brand, last4: card.last4 })}</span>
                <span className="block text-xs text-muted-foreground">{card.holderName}</span>
              </span>
            </label>
          ))
        )}
      </fieldset>

      <div className="space-y-2">
        <Button type="submit" size="lg" disabled={pending || !cardId}>
          {pending ? t("sponsor.processing") : t("sponsor.pay")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("sponsor.mockNotice")}</p>
      </div>
    </form>
  );
}
