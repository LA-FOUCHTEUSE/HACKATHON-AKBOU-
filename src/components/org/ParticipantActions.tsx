"use client";

import { useState, useTransition } from "react";
import type { EnrollmentStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import { markAttendedManually, removeParticipant } from "@/actions/participants";
import { Button } from "@/components/ui/button";

export function ParticipantActions({
  enrollmentId,
  status,
  name,
}: {
  enrollmentId: string;
  status: EnrollmentStatus;
  name: string;
}) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (status === "ATTENDED" || status === "WITHDRAWN") return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await markAttendedManually(enrollmentId);
              if (!r.ok) setMessage(t(`errors.${r.error.code}`));
              else
                setMessage(
                  r.data.alreadyAttended
                    ? t("participants.alreadyToast", { name })
                    : t("participants.attendedToast", { name, points: r.data.pointsAwarded }),
                );
            })
          }
        >
          {t("participants.markAttended")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await removeParticipant(enrollmentId);
              if (!r.ok) setMessage(t(`errors.${r.error.code}`));
            })
          }
        >
          {t("participants.remove")}
        </Button>
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
