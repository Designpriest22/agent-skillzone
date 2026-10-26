/**
 * Brand primitives built from the official logo artwork. The ridge mark reuses
 * the logo's own mountain and sun paths (unchanged geometry, cropped viewBox),
 * so the motif is always the real mark rather than a redrawing.
 */

import { LOGO_RIDGE_PATHS as RIDGE_PATHS, LOGO_SUN_PATH as SUN_PATH } from "./logo-paths";

export function RidgeMark({ className = "ridge-mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="27 0 99 24" aria-hidden="true" focusable="false">
      {RIDGE_PATHS.map((d) => (
        <path key={d.slice(0, 16)} d={d} />
      ))}
      <path d={SUN_PATH} style={{ fill: "var(--sun)" }} />
    </svg>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow">
      <RidgeMark />
      <span>{children}</span>
    </p>
  );
}

/** Splits a heading into words for the staggered text reveal; reads normally to assistive tech. */
export function RevealWords({ text, as: Tag = "h2", className, id }: { text: string; as?: "h1" | "h2" | "h3"; className?: string; id?: string }) {
  const words = text.split(" ");
  return (
    <Tag id={id} className={`${className ?? ""} reveal-words`} data-reveal-words aria-label={text}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} aria-hidden="true">
          <span className="w" style={{ "--w": i } as React.CSSProperties}>
            {w}
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
