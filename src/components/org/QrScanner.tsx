"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, CameraOff } from "lucide-react";
import type { Html5Qrcode } from "html5-qrcode";
import { Link } from "@/i18n/navigation";
import type { ActionResult } from "@/lib/result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CheckInData = {
  volunteerName: string;
  campaignTitle: string;
  pointsAwarded: number;
  newTotal: number;
  alreadyAttended: boolean;
  tierKey: string;
  rankUp: boolean;
  wasWaitlisted: boolean;
};

const READER_ID = "qr-reader";
const DEBOUNCE_MS = 3000;

/** Org scanner: camera decode (html5-qrcode) + manual entry, both POST to /api/checkin. */
export function QrScanner() {
  const t = useTranslations();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastRef = useRef<{ token: string; at: number } | null>(null);
  const busyRef = useRef(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ActionResult<CheckInData> | null>(null);
  const [manual, setManual] = useState("");

  const submit = useCallback(async (raw: string) => {
    const token = raw.trim();
    if (!token || busyRef.current) return;
    const last = lastRef.current;
    if (last && last.token === token && Date.now() - last.at < DEBOUNCE_MS) return;
    lastRef.current = { token, at: Date.now() };
    busyRef.current = true;
    setBusy(true);
    try {
      scannerRef.current?.pause(true);
    } catch {
      // scanner not running
    }
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ token }),
      });
      setResult((await res.json()) as ActionResult<CheckInData>);
    } catch {
      setResult({ ok: false, error: { code: "INTERNAL" } });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setCameraOn(false);
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        // already stopped
      }
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(false);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(READER_ID, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => void submit(decoded),
        () => {},
      );
      setCameraOn(true);
    } catch {
      scannerRef.current = null;
      setCameraOn(false);
      setCameraError(true);
    }
  }, [submit]);

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, [stopCamera]);

  function next() {
    setResult(null);
    lastRef.current = null;
    try {
      scannerRef.current?.resume();
    } catch {
      // not paused
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div id={READER_ID} className="mx-auto w-full max-w-sm overflow-hidden rounded-xl bg-muted" />
        <div className="flex justify-center">
          {cameraOn ? (
            <Button variant="outline" onClick={() => void stopCamera()}>
              <CameraOff className="size-4" />
              {t("scanner.stopCamera")}
            </Button>
          ) : (
            <Button onClick={() => void startCamera()}>
              <Camera className="size-4" />
              {t("scanner.startCamera")}
            </Button>
          )}
        </div>
        {cameraError ? (
          <p className="tw-notice px-4 py-3 text-center text-sm">{t("scanner.cameraError")}</p>
        ) : null}
      </section>

      <AnimatePresence mode="wait">
        {busy ? (
          <motion.p key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm">
            {t("scanner.processing")}
          </motion.p>
        ) : result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={
              result.ok
                ? "space-y-1 rounded-xl border-2 border-primary bg-primary/5 p-4 text-center"
                : "space-y-1 rounded-xl border-2 border-destructive bg-destructive/5 p-4 text-center"
            }
            role="status"
          >
            {result.ok ? (
              <>
                <p className="text-sm font-medium text-primary">
                  {result.data.alreadyAttended ? t("scanner.alreadyAttended") : t("scanner.success")}
                </p>
                <p className="text-2xl font-bold">{result.data.volunteerName}</p>
                <p className="text-sm text-muted-foreground">{result.data.campaignTitle}</p>
                {!result.data.alreadyAttended ? (
                  <p className="text-xl font-semibold text-primary" dir="ltr">
                    {t("scanner.pointsAwarded", { points: result.data.pointsAwarded })}
                  </p>
                ) : null}
                <p className="text-sm">{t("scanner.newTotal", { total: result.data.newTotal })}</p>
                {result.data.rankUp ? (
                  <p className="font-medium">{t("scanner.rankUp", { tier: t(result.data.tierKey) })}</p>
                ) : null}
                {result.data.wasWaitlisted ? (
                  <p className="text-xs text-ochre">{t("scanner.wasWaitlisted")}</p>
                ) : null}
              </>
            ) : (
              <p className="font-medium text-destructive">{t(`errors.${result.error.code}`)}</p>
            )}
            <Button className="mt-2" variant="secondary" onClick={next}>
              {t("scanner.scanNext")}
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="font-semibold">{t("scanner.manualTitle")}</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            lastRef.current = null;
            void submit(manual).then(() => setManual(""));
          }}
        >
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder={t("scanner.manualPlaceholder")}
            dir="ltr"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <Button type="submit" disabled={busy || manual.trim().length < 8}>
            {t("scanner.manualSubmit")}
          </Button>
        </form>
        <p className="pt-2 text-sm text-muted-foreground">
          {t("scanner.participantNote")}{" "}
          <Link href="/org/campaigns" className="underline">
            {t("scanner.participantLink")}
          </Link>
        </p>
      </section>
    </div>
  );
}
