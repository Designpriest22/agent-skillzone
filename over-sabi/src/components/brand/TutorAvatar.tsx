/**
 * Original, abstract tutor portraits: a coloured disc, a headwear/hair silhouette and
 * the tutor's tone-line. Deliberately not photorealistic — tutors are AI characters.
 */
const LOOKS: Record<
  string,
  { bg: string; fg: string; skin: string; shape: "wrap" | "crop" | "braids" | "cap" | "afro" | "fade" }
> = {
  kemi: { bg: "#e0552a", fg: "#16130f", skin: "#8d5524", shape: "wrap" },
  tunde: { bg: "#27306b", fg: "#f4ede1", skin: "#5c3a21", shape: "cap" },
  chiamaka: { bg: "#0e4a37", fg: "#16130f", skin: "#a0663f", shape: "braids" },
  obinna: { bg: "#c8f03c", fg: "#16130f", skin: "#6b4226", shape: "fade" },
  hauwa: { bg: "#b23f17", fg: "#f4ede1", skin: "#9c6b43", shape: "wrap" },
  musa: { bg: "#eadbc6", fg: "#16130f", skin: "#4a2f1b", shape: "afro" },
};

export function TutorAvatar({
  avatarKey,
  name,
  size = 64,
}: {
  avatarKey: string;
  name: string;
  size?: number;
}) {
  const look = LOOKS[avatarKey] ?? { bg: "#0e4a37", fg: "#f4ede1", skin: "#7a4a2b", shape: "crop" as const };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={`${name}, AI tutor`}
      className="shrink-0"
    >
      <circle cx="32" cy="32" r="32" fill={look.bg} />
      {/* shoulders */}
      <path d="M12 64c2-11 10-17 20-17s18 6 20 17z" fill={look.fg} opacity="0.92" />
      {/* face */}
      <ellipse cx="32" cy="31" rx="10" ry="12" fill={look.skin} />
      {look.shape === "wrap" && (
        <path d="M19 27c0-10 6-15 13-15s14 4 14 14c-4-3-9-5-14-5s-9 2-13 6z" fill={look.fg} />
      )}
      {look.shape === "cap" && <path d="M21 24c1-6 6-9 11-9s10 3 11 9z" fill={look.fg} />}
      {look.shape === "braids" && (
        <g fill={look.fg}>
          <path d="M21 26c0-8 5-12 11-12s11 4 11 12c-3-2-7-4-11-4s-8 2-11 4z" />
          <rect x="19" y="26" width="3.5" height="20" rx="1.7" />
          <rect x="41.5" y="26" width="3.5" height="20" rx="1.7" />
        </g>
      )}
      {look.shape === "afro" && <path d="M19 27a13 13 0 1 1 26 0c-3-4-8-6-13-6s-10 2-13 6z" fill={look.fg} />}
      {look.shape === "fade" && (
        <path d="M22 25c0-6 4-10 10-10s10 4 10 10c-3-1-6-2-10-2s-7 1-10 2z" fill={look.fg} />
      )}
      {/* tone-line mouth: the brand's signature */}
      <polyline
        points="27,36 30,34 33,37 37,35"
        fill="none"
        stroke="#f4ede1"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AiBadge() {
  return (
    <span
      className="inline-flex items-center rounded-full border border-border px-2 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-muted"
      title="This tutor is an AI character, not a real person."
    >
      AI tutor
    </span>
  );
}
