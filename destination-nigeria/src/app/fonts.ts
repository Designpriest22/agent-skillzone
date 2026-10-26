import localFont from "next/font/local";

/**
 * Self-hosted fonts (SIL Open Font License) loaded through next/font so they are
 * preloaded and get size-adjusted fallbacks — no layout shift when they swap in.
 * Source files come from the @fontsource packages (Latin subset).
 */
export const display = localFont({
  src: [
    { path: "../../node_modules/@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-opsz-normal.woff2", style: "normal", weight: "400 900" },
    { path: "../../node_modules/@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-opsz-italic.woff2", style: "italic", weight: "400 900" },
  ],
  variable: "--nf-display",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const sans = localFont({
  src: [{ path: "../../node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wdth-normal.woff2", style: "normal", weight: "400 700" }],
  variable: "--nf-sans",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const mono = localFont({
  src: [{ path: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2", style: "normal", weight: "500" }],
  variable: "--nf-mono",
  display: "swap",
  preload: false,
});
