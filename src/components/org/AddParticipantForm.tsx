"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { addParticipantByName } from "@/actions/participants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Candidate = { fullName: string; city: string | null };

export function AddParticipantForm({ campaignId }: { campaignId: string }) {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const r = await addParticipantByName(campaignId, name);
          if (r.ok) {
            setMessage(t("participants.added", { name: r.data.volunteerName }));
            setName("");
          } else if (r.error.code === "AMBIGUOUS_NAME") {
            const candidates = (r.error.details as { candidates?: Candidate[] } | undefined)?.candidates ?? [];
            setMessage(
              t("participants.candidates", {
                names: candidates.map((c) => (c.city ? `${c.fullName} (${c.city})` : c.fullName)).join(", "),
              }),
            );
          } else {
            setMessage(t(`errors.${r.error.code}`));
          }
        });
      }}
    >
      <label htmlFor="volunteerName" className="text-sm font-medium">
        {t("participants.addTitle")}
      </label>
      <div className="flex gap-2">
        <Input
          id="volunteerName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("participants.namePlaceholder")}
        />
        <Button type="submit" disabled={pending || name.trim().length < 2}>
          {t("participants.add")}
        </Button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
