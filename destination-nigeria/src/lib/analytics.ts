/**
 * Privacy-conscious analytics.
 *
 * Events are only sent when (1) a provider is configured with
 * NEXT_PUBLIC_PLAUSIBLE_DOMAIN and (2) the visitor has allowed analytics in
 * cookie & storage preferences. Plausible is cookieless and does not collect
 * personal data; we still ask first. Never pass names, emails, free text or
 * other personal data as event properties.
 */

export type AnalyticsEvent =
  | "destination_search"
  | "destination_filter"
  | "destination_view"
  | "trip_shortlist_add"
  | "itinerary_export"
  | "investment_enquiry_start"
  | "investment_enquiry_submit"
  | "partner_enquiry_submit"
  | "newsletter_signup"
  | "booking_link_click"
  | "national_tourism_week_interest";

type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Props }) => void;
  }
}

export const CONSENT_KEY = "dn:consent";

export function analyticsEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN);
}

export function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "analytics";
  } catch {
    return false;
  }
}

export function track(event: AnalyticsEvent, props?: Props): void {
  if (typeof window === "undefined" || !analyticsEnabled() || !hasAnalyticsConsent()) return;
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    // analytics must never break the page
  }
}
