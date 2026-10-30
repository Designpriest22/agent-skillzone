import { toneContour, type Tone } from "@/lib/tone";

const Y: Record<Tone, number> = { H: 4, M: 14, L: 24 };

/**
 * Draws the pitch shape of a Yoruba phrase from its tone marks: acute = high,
 * grave = low, unmarked = mid. Only rendered when the text actually carries tone
 * marks — it never guesses tones for unmarked text.
 */
export function ToneContour({
  text,
  className = "",
  animate = false,
  showLegend = false,
}: {
  text: string;
  className?: string;
  animate?: boolean;
  showLegend?: boolean;
}) {
  const tones = toneContour(text);
  if (!tones) return null;
  const step = 22;
  const width = Math.max(step * (tones.length - 1), 1) + 8;
  const points = tones.map((t, i) => `${4 + i * step},${Y[t]}`).join(" ");
  const len = tones.length * step + 40;
  const label = `Tone pattern: ${tones.map((t) => ({ H: "high", M: "mid", L: "low" })[t]).join(", ")}`;
  return (
    <span className={`inline-flex flex-col gap-1 ${className}`}>
      <svg
        viewBox={`0 0 ${width} 28`}
        width={width}
        height={28}
        role="img"
        aria-label={label}
        className="overflow-visible"
      >
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animate ? "os-draw" : undefined}
          style={{ ["--len" as string]: len }}
        />
        {tones.map((t, i) => (
          <circle key={i} cx={4 + i * step} cy={Y[t]} r="3.5" fill="var(--color-accent)" />
        ))}
      </svg>
      {showLegend ? (
        <span className="font-mono text-[0.7rem] uppercase tracking-wider text-muted" aria-hidden>
          {tones.join(" · ")}
        </span>
      ) : null}
    </span>
  );
}
