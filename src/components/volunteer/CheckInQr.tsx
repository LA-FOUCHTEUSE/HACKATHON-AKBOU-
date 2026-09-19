"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import QRCode from "qrcode";
import { useFormatter, useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { issueCheckInToken } from "@/actions/checkin";
import { Button } from "@/components/ui/button";

/** Renders the opaque check-in token as a QR code. The QR payload is the token string only. */
export function CheckInQr({ campaignId }: { campaignId: string }) {
  const t = useTranslations();
  const format = useFormatter();
  const [pending, startTransition] = useTransition();
  const [svg, setSvg] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const result = await issueCheckInToken(campaignId);
      if (!result.ok) {
        setError(result.error.code);
        return;
      }
      const markup = await QRCode.toString(result.data.token, { type: "svg", errorCorrectionLevel: "M", margin: 2 });
      setSvg(markup);
      setToken(result.data.token);
      setExpiresAt(result.data.expiresAt);
    });
  }, [campaignId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{t(`errors.${error}`)}</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="aspect-square w-full max-w-xs rounded-xl border bg-white p-3">
        {svg ? (
          // SVG generated locally by the qrcode library from the token string.
          <div className="size-full [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
            {t("checkin.generating")}
          </div>
        )}
      </div>
      {token && expiresAt ? (
        <div className="space-y-1 text-center">
          <p className="text-sm text-muted-foreground">
            {t("checkin.expires", { time: format.dateTime(new Date(expiresAt), "time") })}
          </p>
          <p className="text-xs text-muted-foreground">{t("checkin.manualCode")}</p>
          <p className="font-mono text-sm break-all select-all" dir="ltr">
            {token}
          </p>
        </div>
      ) : null}
      <Button variant="outline" size="sm" onClick={load} disabled={pending}>
        <RefreshCw className="size-4" />
        {t("checkin.regenerate")}
      </Button>
    </div>
  );
}
