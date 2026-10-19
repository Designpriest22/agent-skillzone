"use client";
import { useState } from "react";

/** Share an achievement via the Web Share API, falling back to copying text. No tracking links. */
export function ShareAchievement({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const text = `I just earned “${name}” learning an African language on Over Sabi.`;
    const url = `${window.location.origin}/`;
    try {
      if (navigator.share) await navigator.share({ title: "Over Sabi", text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
      }
    } catch {
      /* share cancelled */
    }
  }
  return (
    <button type="button" onClick={share} className="self-start text-xs font-semibold underline">
      {copied ? "Copied" : "Share"}
    </button>
  );
}
