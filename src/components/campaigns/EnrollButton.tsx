"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { EnrollmentStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { QrCode } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { enroll, withdraw } from "@/actions/enrollment";
import { Button } from "@/components/ui/button";

type Props = {
  campaignId: string;
  status: EnrollmentStatus | null;
  /** false when the visitor is not a logged-in volunteer */
  canEnroll: boolean;
  closed?: boolean;
};

export function EnrollButton({ campaignId, status, canEnroll, closed = false }: Props) {
  const t = useTranslations();
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!canEnroll) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">{t("campaigns.loginToEnroll")}</Link>
      </Button>
    );
  }

  if (optimistic === "ATTENDED") {
    return <span className="text-sm font-medium text-primary">{t("campaigns.attended")}</span>;
  }

  const isIn = optimistic === "ENROLLED" || optimistic === "WAITLISTED";

  function onEnroll() {
    setMessage(null);
    startTransition(async () => {
      setOptimistic("ENROLLED");
      const result = await enroll(campaignId);
      if (!result.ok) setMessage(t(`errors.${result.error.code}`));
      else if (result.data.status === "WAITLISTED") setMessage(t("campaigns.waitlistedToast"));
    });
  }

  function onWithdraw() {
    setMessage(null);
    startTransition(async () => {
      setOptimistic("WITHDRAWN");
      const result = await withdraw(campaignId);
      if (!result.ok) setMessage(t(`errors.${result.error.code}`));
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {isIn ? (
          <>
            <motion.span
              key={optimistic}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              {optimistic === "WAITLISTED" ? t("campaigns.waitlisted") : t("campaigns.enrolled")}
            </motion.span>
            <Button asChild size="sm" variant="secondary">
              <Link href={`/volunteer/checkin/${campaignId}`}>
                <QrCode className="size-4" />
                {t("campaigns.showQr")}
              </Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={onWithdraw} disabled={pending}>
              {t("campaigns.withdraw")}
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={onEnroll} disabled={pending || closed}>
            {t("campaigns.enroll")}
          </Button>
        )}
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
