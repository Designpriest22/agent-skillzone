"use client";

import { track } from "@/lib/analytics";

/** External booking link, clearly labelled as third-party. */
export function BookingLink({ href, provider, offerId }: { href: string; provider: string; offerId: string }) {
  const host = (() => {
    try {
      return new URL(href).hostname.replace(/^www\./, "");
    } catch {
      return "provider site";
    }
  })();
  return (
    <a className="btn btn--forest" href={href} target="_blank" rel="noopener sponsored" onClick={() => track("booking_link_click", { offer: offerId })}>
      Book with {provider} <span aria-hidden="true">↗</span>
      <span className="visually-hidden"> (external site {host}, opens in a new tab)</span>
    </a>
  );
}
