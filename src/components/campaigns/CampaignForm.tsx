"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import type { ActivityDomain } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { campaignCreateSchema, campaignUpdateSchema } from "@/lib/validation";
import { ACTIVITY_DOMAINS } from "@/lib/domains";
import { fromAlgiersInput } from "@/lib/dates";
import { createCampaign, updateCampaign } from "@/actions/campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/forms/Field";

type In = z.input<typeof campaignUpdateSchema>;

export interface CampaignFormDefaults {
  title: string;
  description: string;
  domain: ActivityDomain;
  city: string;
  location: string;
  /** "YYYY-MM-DDTHH:mm" in Algeria time */
  startAt: string;
  endAt: string;
  capacity: number;
  pointsValue: number;
  status: "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED";
  needsFunding: boolean;
  fundingGoal: number | "";
  sponsorRequested: boolean;
}

const selectClass = "h-9 w-full rounded-md border bg-transparent px-3 text-sm";

export function CampaignForm({ campaignId, defaults }: { campaignId?: string; defaults: CampaignFormDefaults }) {
  const t = useTranslations();
  const router = useRouter();
  const isEdit = Boolean(campaignId);
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const form = useForm<In>({
    resolver: zodResolver(isEdit ? campaignUpdateSchema : campaignCreateSchema) as never,
    defaultValues: defaults as In,
  });
  const { errors } = form.formState;
  const needsFunding = form.watch("needsFunding");

  const onSubmit = form.handleSubmit(() =>
    startTransition(async () => {
      setFormError(null);
      setNotice(null);
      const raw = form.getValues();
      // Dates are entered in Algeria time and sent as absolute ISO timestamps.
      const payload = {
        ...raw,
        startAt: fromAlgiersInput(String(raw.startAt)),
        endAt: fromAlgiersInput(String(raw.endAt)),
      };
      const result = campaignId ? await updateCampaign(campaignId, payload) : await createCampaign(payload);
      if (!result.ok) {
        setFormError(result.error.code);
        for (const [field, messages] of Object.entries(result.error.fieldErrors ?? {})) {
          if (messages?.[0]) form.setError(field as keyof In, { message: messages[0] });
        }
        return;
      }
      if (isEdit) {
        router.push("/org/campaigns");
      } else {
        setNotice(t("org.createdToast"));
        form.reset(defaults as In);
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError code={formError} />
      {notice ? <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{notice}</p> : null}
      <Field id="title" label={t("org.form.title")} error={errors.title?.message}>
        <Input id="title" {...form.register("title")} />
      </Field>
      <Field id="description" label={t("org.form.description")} error={errors.description?.message}>
        <Textarea id="description" rows={4} {...form.register("description")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="domain" label={t("org.form.domain")} error={errors.domain?.message}>
          <select id="domain" className={selectClass} {...form.register("domain")}>
            {ACTIVITY_DOMAINS.map((d) => (
              <option key={d} value={d}>
                {t(`domains.${d}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field id="status" label={t("org.form.status")} error={errors.status?.message}>
          <select id="status" className={selectClass} {...form.register("status")}>
            {(isEdit ? (["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED"] as const) : (["PUBLISHED", "DRAFT"] as const)).map(
              (s) => (
                <option key={s} value={s}>
                  {t(`status.campaign.${s}`)}
                </option>
              ),
            )}
          </select>
        </Field>
        <Field id="city" label={t("org.form.city")} error={errors.city?.message} optional>
          <Input id="city" {...form.register("city")} />
        </Field>
        <Field id="location" label={t("org.form.location")} error={errors.location?.message} optional>
          <Input id="location" {...form.register("location")} />
        </Field>
        <Field id="startAt" label={t("org.form.startAt")} error={errors.startAt?.message}>
          <Input id="startAt" type="datetime-local" dir="ltr" {...form.register("startAt")} />
        </Field>
        <Field id="endAt" label={t("org.form.endAt")} error={errors.endAt?.message}>
          <Input id="endAt" type="datetime-local" dir="ltr" {...form.register("endAt")} />
        </Field>
        <Field id="capacity" label={t("org.form.capacity")} error={errors.capacity?.message}>
          <Input id="capacity" type="number" min={0} inputMode="numeric" {...form.register("capacity")} />
        </Field>
        <Field id="pointsValue" label={t("org.form.pointsValue")} error={errors.pointsValue?.message}>
          <Input id="pointsValue" type="number" min={0} inputMode="numeric" {...form.register("pointsValue")} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4" {...form.register("needsFunding")} />
        {t("org.form.needsFunding")}
      </label>
      {needsFunding ? (
        <Field id="fundingGoal" label={t("org.form.fundingGoal")} error={errors.fundingGoal?.message}>
          <Input id="fundingGoal" type="number" min={1000} inputMode="numeric" {...form.register("fundingGoal")} />
        </Field>
      ) : null}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4" {...form.register("sponsorRequested")} />
        {t("org.form.sponsorRequested")}
      </label>
      <Button type="submit" disabled={pending}>
        {isEdit ? t("org.form.update") : t("org.form.create")}
      </Button>
    </form>
  );
}
