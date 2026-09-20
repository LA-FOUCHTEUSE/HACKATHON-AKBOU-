"use client";

import { useOptimistic, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/actions/favorites";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FavoriteButton({ campaignId, isFavorite }: { campaignId: string; isFavorite: boolean }) {
  const t = useTranslations("campaigns");
  const [optimistic, setOptimistic] = useOptimistic(isFavorite);
  const [pending, startTransition] = useTransition();
  const label = optimistic ? t("unfavorite") : t("favorite");

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={optimistic}
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await toggleFavorite(campaignId);
        })
      }
    >
      <Heart className={cn("size-5", optimistic ? "fill-rose-600 text-volunteer" : "text-muted-foreground")} />
    </Button>
  );
}
