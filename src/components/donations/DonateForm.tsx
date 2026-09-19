"use client";

import { useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { HeartHandshake } from "lucide-react";
import { donate } from "@/actions/contributions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/forms/Field";

const PRESETS = [1000, 5000, 10000, 25000];

/** Individual donation: donor name + amount. No account and no card input (mock payment). */
export function DonateForm({ campaignId, defaultName }: { campaignId: string; defaultName: string }) {
  const t = useTranslations();
  const format = useFormatter();
  const [donorName, setDonorName] = useState(defaultName);
  const [amount, setAmount] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [thanks, setThanks] = useState<number | null>(null);

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});
        setThanks(null);
        startTransition(async () => {
          const result = await donate({ campaignId, donorName, amountDZD: amount });
          if (result.ok) {
            setThanks(result.data.amountDZD);
            setAmount("");
          } else {
            setError(result.error.code);
            setFieldErrors(result.error.fieldErrors ?? {});
          }
        });
      }}
    >
      <h3 className="inline-flex items-center gap-2 text-lg font-semibold">
        <HeartHandshake className="size-5 text-primary" />
        {t("donation.title")}
      </h3>
      {thanks !== null ? (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary" role="status">
          {t("donation.success", { amount: format.number(thanks, "dzd") })}
        </p>
      ) : null}
      <FormError code={error} />
      <Field id="donorName" label={t("donation.donorName")} error={fieldErrors.donorName?.[0]}>
        <Input id="donorName" value={donorName} onChange={(e) => setDonorName(e.target.value)} autoComplete="name" />
      </Field>
      <Field id="amount" label={t("donation.amount")} error={fieldErrors.amountDZD?.[0]}>
        <Input
          id="amount"
          inputMode="numeric"
          dir="ltr"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
        />
      </Field>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("donation.presets")}>
        {PRESETS.map((value) => (
          <Button key={value} type="button" size="sm" variant="outline" onClick={() => setAmount(String(value))}>
            {format.number(value, "dzd")}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        <Button type="submit" disabled={pending || !amount || donorName.trim().length < 2}>
          {pending ? t("donation.processing") : t("donation.submit")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("donation.mockNotice")}</p>
      </div>
    </form>
  );
}
