"use client";
export default function OSError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-bad/30 bg-bad-soft p-5">
      <h2 className="font-semibold text-bad">Something went wrong</h2>
      <p className="mt-1 text-[13px] text-fg-2">{error.message || "Unexpected error."}{error.digest ? ` (ref ${error.digest})` : ""}</p>
      <button onClick={reset} className="mt-3 rounded-md border border-line-strong bg-panel px-3 py-1 text-[13px]">Try again</button>
    </div>
  );
}
