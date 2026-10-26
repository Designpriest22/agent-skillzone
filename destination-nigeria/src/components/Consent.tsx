"use client";

import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";
import { analyticsEnabled, CONSENT_KEY } from "@/lib/analytics";

/**
 * Consent for optional analytics. Nothing optional loads until the visitor
 * says yes. If no analytics provider is configured there is nothing to
 * consent to, so no banner appears.
 */

type Choice = "analytics" | "essential" | null;
const listeners = new Set<() => void>();
const OPEN_EVENT = "dn:open-consent";

function readChoice(): Choice {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "analytics" || v === "essential" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(choice: Exclude<Choice, null>) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

export function useConsent(): Choice | undefined {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    readChoice,
    () => undefined,
  );
}

export function ConsentManager() {
  const choice = useConsent();
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    const open = () => setForceOpen(true);
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  if (!analyticsEnabled()) return null;
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN!;
  const src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";
  const showBanner = choice === null || forceOpen;

  return (
    <>
      {choice === "analytics" ? (
        <>
          <Script id="plausible-queue" strategy="afterInteractive">
            {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}`}
          </Script>
          <Script src={src} data-domain={domain} strategy="afterInteractive" />
        </>
      ) : null}
      {showBanner ? (
        <section className="consent glass-light" aria-labelledby="consent-title">
          <h2 id="consent-title" className="t-3" style={{ fontWeight: 600, fontSize: "1.05rem" }}>
            Help us improve this site
          </h2>
          <p style={{ fontSize: "0.925rem" }}>
            With your permission we use privacy-friendly, cookieless analytics to count visits and see which tools people use. No personal data is collected and nothing is used for advertising.{" "}
            <a href="/cookies">Cookies &amp; storage</a>
          </p>
          <div className="cluster">
            <button
              type="button"
              className="btn btn--forest btn--sm"
              onClick={() => {
                setConsent("analytics");
                setForceOpen(false);
              }}
            >
              Allow analytics
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setConsent("essential");
                setForceOpen(false);
              }}
            >
              Essential only
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}

export function CookieSettingsLink() {
  return (
    <a
      href="/cookies"
      onClick={(e) => {
        if (analyticsEnabled()) {
          e.preventDefault();
          window.dispatchEvent(new Event(OPEN_EVENT));
        }
      }}
    >
      Cookie preferences
    </a>
  );
}
