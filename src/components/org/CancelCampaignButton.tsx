"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { deleteCampaign } from "@/actions/campaigns";
import { Button } from "@/components/ui/button";

export function CancelCampaignButton({ campaignId }: { campaignId: string }) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(t("org.cancelConfirm"))) return;
          startTransition(async () => {
            const result = await deleteCampaign(campaignId);
            setMessage(
              result.ok ? t("org.cancelledToast", { count: result.data.notified }) : t(`errors.${result.error.code}`),
            );
          });
        }}
      >
        {t("org.cancelCampaign")}
      </Button>
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  );
}
