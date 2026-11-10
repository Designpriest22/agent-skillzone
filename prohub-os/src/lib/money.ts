/** All money is integer minor units (kobo). These helpers are the only place conversion happens. */
export const toMinor = (major: number) => Math.round(major * 100);
export const toMajor = (minor: number) => minor / 100;

export function formatMoney(minor: number | null | undefined, currency = "NGN", opts: { compact?: boolean } = {}): string {
  if (minor === null || minor === undefined) return "—";
  const major = minor / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    notation: opts.compact ? "compact" : "standard",
    maximumFractionDigits: opts.compact ? 1 : 0,
  }).format(major);
}

export function pct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${n.toFixed(digits)}%`;
}
