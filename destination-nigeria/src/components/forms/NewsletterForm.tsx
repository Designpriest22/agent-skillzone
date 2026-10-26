"use client";

import { useId } from "react";
import { track } from "@/lib/analytics";
import { audienceOptions, interestOptions, newsletterSchema } from "@/lib/forms";
import { CheckboxGroup, Consent, FormStatus, Honeypot, SelectField, SubmitButton, TextField } from "./fields";
import { readForm, useEnquiryForm } from "./useForm";

export function NewsletterForm({ defaultInterest, compact = false }: { defaultInterest?: "ntw"; compact?: boolean }) {
  const idPrefix = useId().replace(/:/g, "");
  const { formRef, errors, state, submit } = useEnquiryForm(newsletterSchema, {
    onSuccess: () => {
      track("newsletter_signup");
      if (defaultInterest === "ntw") track("national_tourism_week_interest");
    },
  });

  return (
    <form
      ref={formRef}
      noValidate
      className="form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        const values = readForm(e.currentTarget, ["interests"]);
        if (defaultInterest && !(values.interests as string[]).includes(defaultInterest)) (values.interests as string[]).push(defaultInterest);
        void submit({ kind: "newsletter", ...values });
      }}
    >
      <Honeypot />
      <TextField idPrefix={idPrefix} name="email" type="email" label="Email address" autoComplete="email" required error={errors.email} />
      <SelectField idPrefix={idPrefix} name="audience" label="I am a…" options={audienceOptions} required error={errors.audience} />
      {compact ? null : <CheckboxGroup idPrefix={idPrefix} name="interests" label="Send me updates about" options={interestOptions} error={errors.interests} />}
      <Consent idPrefix={idPrefix} error={errors.consent}>
        I agree to receive Destination Nigeria updates by email and can unsubscribe at any time.
      </Consent>
      <FormStatus state={state} success={<><strong>You&apos;re subscribed.</strong> We&apos;ll email you when there&apos;s news that matches your interests.</>} />
      <div>
        <SubmitButton state={state} className="btn btn--sun">
          Subscribe
        </SubmitButton>
      </div>
    </form>
  );
}
