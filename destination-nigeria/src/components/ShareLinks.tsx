"use client";

import { useState } from "react";

/** Plain share links (no third-party scripts or tracking pixels) plus native share where available. */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [status, setStatus] = useState("");
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
    { label: "X", href: `https://x.com/intent/post?url=${u}&text=${t}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: "Email", href: `mailto:?subject=${t}&body=${u}` },
  ];
  return (
    <div className="panel stack">
      <p className="eyebrow">Share</p>
      <ul className="chip-row" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {links.map((l) => (
          <li key={l.label}>
            <a className="chip" href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label}
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
        <li>
          <button
            type="button"
            className="chip"
            onClick={async () => {
              try {
                if (navigator.share) await navigator.share({ title, url });
                else {
                  await navigator.clipboard.writeText(url);
                  setStatus("Link copied.");
                }
              } catch {
                /* share dismissed */
              }
            }}
          >
            Copy or share
          </button>
        </li>
      </ul>
      <p aria-live="polite" className="mono">
        {status}
      </p>
    </div>
  );
}
