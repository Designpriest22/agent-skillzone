"use client";

import { useId, useRef } from "react";
import { opportunityCategories } from "@/content/platform";
import { track } from "@/lib/analytics";
import { investmentSchema, investorTypes, partnerInterests, partnershipSchema, partnerTypes, ticketSizes } from "@/lib/forms";
import { CheckboxGroup, Consent, FormStatus, Honeypot, SelectField, SubmitButton, TextArea, TextField } from "./fields";
import { readForm, useEnquiryForm } from "./useForm";

export function InvestmentForm() {
  const idPrefix = useId().replace(/:/g, "");
  const startedTracking = useRef(false);
  const { formRef, errors, state, submit } = useEnquiryForm(investmentSchema, { onSuccess: () => track("investment_enquiry_submit") });
  return (
    <form
      ref={formRef}
      noValidate
      className="form-grid form-grid--2"
      onFocus={() => {
        if (!startedTracking.current) {
          startedTracking.current = true;
          track("investment_enquiry_start");
        }
      }}
      onSubmit={(e) => {
        e.preventDefault();
        void submit({ kind: "investment", ...readForm(e.currentTarget, ["interests"]) });
      }}
    >
      <Honeypot />
      <TextField idPrefix={idPrefix} name="name" label="Your name" autoComplete="name" required error={errors.name} />
      <TextField idPrefix={idPrefix} name="email" type="email" label="Work email" autoComplete="email" required error={errors.email} />
      <TextField idPrefix={idPrefix} name="organisation" label="Organisation" autoComplete="organization" required error={errors.organisation} />
      <TextField idPrefix={idPrefix} name="country" label="Country" autoComplete="country-name" error={errors.country} />
      <SelectField idPrefix={idPrefix} name="investorType" label="Investor type" options={investorTypes} required error={errors.investorType} />
      <SelectField idPrefix={idPrefix} name="ticketSize" label="Indicative ticket size" options={ticketSizes} placeholder="Prefer not to say" error={errors.ticketSize} />
      <div className="span-2">
        <CheckboxGroup idPrefix={idPrefix} name="interests" label="Opportunity categories of interest" options={opportunityCategories.map((c) => ({ value: c.id, label: c.label }))} error={errors.interests} />
      </div>
      <div className="span-2">
        <TextField idPrefix={idPrefix} name="states" label="States or regions of interest" hint="For example: Lagos, Cross River, the North Central zone." error={errors.states} />
      </div>
      <div className="span-2">
        <TextArea idPrefix={idPrefix} name="message" label="What would you like to discuss?" hint="Please don't include confidential financial information at this stage." required error={errors.message} />
      </div>
      <div className="span-2">
        <Consent idPrefix={idPrefix} error={errors.consent} />
      </div>
      <div className="span-2 stack">
        <FormStatus state={state} success={<><strong>Enquiry sent.</strong> The Destination Nigeria team will review it and reply by email.</>} />
        <div>
          <SubmitButton state={state}>Send investment enquiry</SubmitButton>
        </div>
      </div>
    </form>
  );
}

export function PartnershipForm({ defaultInterest }: { defaultInterest?: (typeof partnerInterests)[number]["value"] }) {
  const idPrefix = useId().replace(/:/g, "");
  const { formRef, errors, state, submit } = useEnquiryForm(partnershipSchema, {
    onSuccess: () => {
      track("partner_enquiry_submit");
    },
  });
  return (
    <form
      ref={formRef}
      noValidate
      className="form-grid form-grid--2"
      onSubmit={(e) => {
        e.preventDefault();
        const values = readForm(e.currentTarget);
        void submit({ kind: "partnership", ...values });
        if (values.interest === "ntw") track("national_tourism_week_interest");
      }}
    >
      <Honeypot />
      <TextField idPrefix={idPrefix} name="name" label="Your name" autoComplete="name" required error={errors.name} />
      <TextField idPrefix={idPrefix} name="email" type="email" label="Work email" autoComplete="email" required error={errors.email} />
      <TextField idPrefix={idPrefix} name="organisation" label="Organisation" autoComplete="organization" required error={errors.organisation} />
      <TextField idPrefix={idPrefix} name="role" label="Your role" autoComplete="organization-title" error={errors.role} />
      <SelectField idPrefix={idPrefix} name="partnerType" label="Organisation type" options={partnerTypes} required error={errors.partnerType} />
      <PartnerInterestSelect idPrefix={idPrefix} error={errors.interest} defaultInterest={defaultInterest} />
      <div className="span-2">
        <TextField idPrefix={idPrefix} name="website" type="url" label="Website" hint="Include https://" autoComplete="url" error={errors.website} />
      </div>
      <div className="span-2">
        <TextArea idPrefix={idPrefix} name="message" label="Tell us about your organisation and what you propose" required error={errors.message} />
      </div>
      <div className="span-2">
        <Consent idPrefix={idPrefix} error={errors.consent} />
      </div>
      <div className="span-2 stack">
        <FormStatus state={state} success={<><strong>Expression of interest sent.</strong> The partnerships team will review it and reply by email.</>} />
        <div>
          <SubmitButton state={state}>Send expression of interest</SubmitButton>
        </div>
      </div>
    </form>
  );
}

function PartnerInterestSelect({ idPrefix, error, defaultInterest }: { idPrefix: string; error?: string; defaultInterest?: string }) {
  const id = `${idPrefix}-interest`;
  return (
    <div className="field">
      <label htmlFor={id}>I&apos;d like to</label>
      <select id={id} name="interest" className="select" required defaultValue={defaultInterest ?? ""} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}>
        <option value="" disabled>
          Choose…
        </option>
        {partnerInterests.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="field-error" id={`${id}-error`}>
          <span aria-hidden="true">!</span> {error}
        </p>
      ) : null}
    </div>
  );
}
