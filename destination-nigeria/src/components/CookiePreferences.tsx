"use client";

import { analyticsEnabled } from "@/lib/analytics";
import { setConsent, useConsent } from "./Consent";

export function CookiePreferences() {
  const choice = useConsent();
  if (!analyticsEnabled()) {
    return <p>Analytics is not currently enabled on this site, so there is nothing to opt in to.</p>;
  }
  return (
    <div className="stack">
      <p>We use cookieless, privacy-friendly analytics only if you allow it.</p>
      <p role="status">Your current choice: {choice === "analytics" ? "analytics allowed" : choice === "essential" ? "essential only" : "not chosen yet (no analytics)"}.</p>
      <div className="cluster">
        <button type="button" className="btn btn--forest btn--sm" onClick={() => setConsent("analytics")} aria-pressed={choice === "analytics"}>
          Allow analytics
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConsent("essential")} aria-pressed={choice === "essential"}>
          Essential only
        </button>
      </div>
    </div>
  );
}
