import { z } from "zod";

/**
 * Form definitions shared by the client (inline validation) and the server
 * (authoritative validation in /api/forms). Collect only what is needed to
 * respond to the enquiry.
 */

const name = z.string().trim().min(2, "Enter your name.").max(120, "Keep your name under 120 characters.");
const email = z.email("Enter an email address in the format name@example.com.").trim().max(200);
const org = z.string().trim().max(160, "Keep this under 160 characters.");
const message = z.string().trim().min(20, "Tell us a little more (at least 20 characters).").max(4000, "Keep your message under 4,000 characters.");
const consent = z.literal(true, { error: "Tick the box to agree, so we can reply to you." });
const country = z.string().trim().max(80).optional().default("");

export const audienceOptions = [
  { value: "traveller", label: "Traveller" },
  { value: "business", label: "Tourism business" },
  { value: "investor", label: "Investor" },
  { value: "media", label: "Media" },
  { value: "institution", label: "Institutional partner" },
] as const;

export const interestOptions = [
  { value: "destinations", label: "New destinations and travel ideas" },
  { value: "ntw", label: "National Tourism Week updates" },
  { value: "investment", label: "Tourism investment" },
  { value: "offers", label: "Verified offers" },
] as const;

export const investorTypes = [
  { value: "hotel-resort", label: "Hotel or resort investor" },
  { value: "fund", label: "Fund or institutional investor" },
  { value: "developer", label: "Developer" },
  { value: "operator", label: "Operator seeking expansion" },
  { value: "dfi", label: "Development finance institution" },
  { value: "other", label: "Other" },
] as const;

export const ticketSizes = [
  { value: "undisclosed", label: "Prefer not to say" },
  { value: "lt-1m", label: "Under US$1 million" },
  { value: "1-10m", label: "US$1–10 million" },
  { value: "10-50m", label: "US$10–50 million" },
  { value: "gt-50m", label: "Over US$50 million" },
] as const;

export const partnerTypes = [
  { value: "state", label: "State tourism authority" },
  { value: "federal", label: "Federal institution" },
  { value: "hospitality", label: "Hospitality operator" },
  { value: "transport", label: "Airline or transport company" },
  { value: "tour-operator", label: "Tour operator or travel buyer" },
  { value: "training", label: "Hospitality training provider" },
  { value: "development", label: "Development partner" },
  { value: "creative", label: "Tourism or creative business" },
  { value: "community", label: "Community or site custodian" },
  { value: "media", label: "Media or creator" },
  { value: "education", label: "Education institution" },
] as const;

export const partnerInterests = [
  { value: "list-offer", label: "List a verified offer or experience" },
  { value: "showcase", label: "Showcase a destination" },
  { value: "ntw", label: "Take part in National Tourism Week" },
  { value: "skills", label: "Skills, training or standards" },
  { value: "media", label: "Media or content partnership" },
  { value: "other", label: "Something else" },
] as const;

const values = <T extends readonly { value: string }[]>(opts: T) => opts.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

export const newsletterSchema = z.object({
  kind: z.literal("newsletter"),
  email,
  audience: z.enum(values(audienceOptions), { error: "Choose the option that best describes you." }),
  interests: z.array(z.enum(values(interestOptions))).max(interestOptions.length).default([]),
  consent,
});

export const investmentSchema = z.object({
  kind: z.literal("investment"),
  name,
  email,
  organisation: org.min(2, "Enter your organisation."),
  country,
  investorType: z.enum(values(investorTypes), { error: "Choose an investor type." }),
  ticketSize: z.enum(values(ticketSizes)).default("undisclosed"),
  interests: z.array(z.string().max(40)).max(12).default([]),
  states: z.string().trim().max(300).optional().default(""),
  message,
  consent,
});

export const partnershipSchema = z.object({
  kind: z.literal("partnership"),
  name,
  email,
  organisation: org.min(2, "Enter your organisation."),
  role: z.string().trim().max(120).optional().default(""),
  partnerType: z.enum(values(partnerTypes), { error: "Choose your organisation type." }),
  interest: z.enum(values(partnerInterests), { error: "Choose what you'd like to do." }),
  website: z.union([z.url("Enter a full web address, starting with https://"), z.literal("")]).optional().default(""),
  message,
  consent,
});

export const formSchema = z.discriminatedUnion("kind", [newsletterSchema, investmentSchema, partnershipSchema]);
export type FormPayload = z.infer<typeof formSchema>;
export type FormKind = FormPayload["kind"];

/** Spam-protection fields sent alongside every form; never stored. */
export const guardSchema = z.object({
  /** Honeypot: hidden from people, must stay empty. */
  company_url: z.string().max(0).optional().default(""),
  /** ms timestamp of when the form was rendered. */
  started: z.coerce.number().int().positive(),
});

/** Turn a ZodError into a { field: message } map for inline display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export const MIN_FILL_MS = 2500;
