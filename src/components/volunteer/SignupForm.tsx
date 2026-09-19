"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useTranslations } from "next-intl";
import { volunteerSignupSchema } from "@/lib/validation";
import { signupVolunteer } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/forms/Field";
import { DomainPicker } from "@/components/forms/DomainPicker";

type In = z.input<typeof volunteerSignupSchema>;
type Out = z.output<typeof volunteerSignupSchema>;

export function SignupForm() {
  const t = useTranslations("onboarding");
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<In, unknown, Out>({
    resolver: zodResolver(volunteerSignupSchema),
    defaultValues: { fullName: "", email: "", city: "", bio: "", preferredDomains: [] },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      setFormError(null);
      const result = await signupVolunteer(values);
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
      <Field id="fullName" label={t("fullName")} error={errors.fullName?.message}>
        <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
      </Field>
      <Field id="email" label={t("email")} error={errors.email?.message} optional>
        <Input id="email" type="email" autoComplete="email" dir="ltr" {...form.register("email")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="city" label={t("city")} error={errors.city?.message} optional>
          <Input id="city" {...form.register("city")} />
        </Field>
        <Field id="birthYear" label={t("birthYear")} error={errors.birthYear?.message} optional>
          <Input id="birthYear" inputMode="numeric" {...form.register("birthYear")} />
        </Field>
      </div>
      <Field id="preferredDomains" label={t("preferredDomains")} error={errors.preferredDomains?.message}>
        <Controller
          control={form.control}
          name="preferredDomains"
          render={({ field }) => <DomainPicker id="preferredDomains" value={field.value} onChange={field.onChange} />}
        />
      </Field>
      <Field id="bio" label={t("bio")} error={errors.bio?.message} optional>
        <Textarea id="bio" rows={3} {...form.register("bio")} />
      </Field>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? t("submitting") : t("submitVolunteer")}
      </Button>
    </form>
  );
}
