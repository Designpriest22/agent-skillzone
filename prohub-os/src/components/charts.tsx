/** Minimal SVG charts. They render only real data and show an empty state otherwise. */
export function BarChart({ data, format, height = 160 }: { data: { label: string; value: number; secondary?: number }[]; format: (v: number) => string; height?: number }) {
  if (!data.length || data.every((d) => d.value === 0 && !d.secondary)) {
    return <div className="flex items-center justify-center rounded-md border border-dashed border-line text-fg-3" style={{ height }}>No recorded data for this period</div>;
  }
  const max = Math.max(...data.map((d) => Math.max(d.value, d.secondary ?? 0)), 1);
  const w = 100 / data.length;
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label="Bar chart">
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2="100" y1={height * f} y2={height * f} stroke="var(--line)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />)}
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 4);
          const h2 = ((d.secondary ?? 0) / max) * (height - 4);
          return (
            <g key={d.label}>
              {d.secondary !== undefined && <rect x={i * w + w * 0.18} y={height - h2} width={w * 0.3} height={h2} fill="var(--line-strong)" rx="0.6"><title>{`${d.label}: ${format(d.secondary)}`}</title></rect>}
              <rect x={i * w + (d.secondary !== undefined ? w * 0.5 : w * 0.22)} y={height - h} width={d.secondary !== undefined ? w * 0.3 : w * 0.56} height={h} fill="var(--accent)" rx="0.6"><title>{`${d.label}: ${format(d.value)}`}</title></rect>
            </g>
          );
        })}
      </svg>
      <div className="mt-1.5 grid text-center text-[11px] text-fg-3" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
        {data.map((d) => <span key={d.label} className="truncate">{d.label}</span>)}
      </div>
    </div>
  );
}

export function HBar({ rows, format }: { rows: { label: string; value: number }[]; format: (v: number) => string }) {
  if (!rows.length) return <div className="text-fg-3">No data</div>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-0.5 flex justify-between gap-2 text-[12.5px]"><span className="truncate text-fg-2">{r.label}</span><span className="num">{format(r.value)}</span></div>
          <div className="h-1.5 rounded-full bg-panel-2"><div className="h-full rounded-full bg-accent" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
