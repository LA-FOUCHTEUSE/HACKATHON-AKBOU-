"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useTranslations } from "next-intl";
import { orgSignupSchema } from "@/lib/validation";
import { signupOrganization } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/forms/Field";
import { DomainPicker } from "@/components/forms/DomainPicker";

type In = z.input<typeof orgSignupSchema>;
type Out = z.output<typeof orgSignupSchema>;

export function OrgSignupForm() {
  const t = useTranslations("onboarding");
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<In, unknown, Out>({
    resolver: zodResolver(orgSignupSchema),
    defaultValues: { name: "", email: "", description: "", city: "", contactPhone: "", domains: [] },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      setFormError(null);
      const result = await signupOrganization(values);
      if (result && !result.ok) {
        setFormError(result.error.code);
        for (const [field, messages] of Object.entries(result.error.fieldErrors ?? {})) {
          if (messages?.[0]) form.setError(field as keyof In, { message: messages[0] });
        }
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError code={formError} />
      <Field id="name" label={t("orgName")} error={errors.name?.message}>
        <Input id="name" {...form.register("name")} />
      </Field>
      <Field id="domains" label={t("domains")} error={errors.domains?.message}>
        <Controller
          control={form.control}
          name="domains"
          render={({ field }) => <DomainPicker id="domains" value={field.value} onChange={field.onChange} />}
        />
      </Field>
      <Field id="description" label={t("description")} error={errors.description?.message} optional>
        <Textarea id="description" rows={4} {...form.register("description")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="city" label={t("city")} error={errors.city?.message} optional>
          <Input id="city" {...form.register("city")} />
        </Field>
        <Field id="contactPhone" label={t("contactPhone")} error={errors.contactPhone?.message} optional>
          <Input id="contactPhone" type="tel" dir="ltr" {...form.register("contactPhone")} />
        </Field>
      </div>
      <Field id="email" label={t("email")} error={errors.email?.message} optional>
        <Input id="email" type="email" dir="ltr" {...form.register("email")} />
      </Field>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? t("submitting") : t("submitOrg")}
      </Button>
    </form>
  );
}
