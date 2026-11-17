import type { ReactNode } from "react";
import { ToneContour } from "@/components/brand/ToneContour";

export function AuthShell({
  title,
  children,
  aside,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-[1fr_1fr] md:py-20">
      <div className="hidden flex-col justify-center md:flex">
        <p className="lang-text font-display text-5xl font-extrabold leading-tight">Ẹ kú àbọ̀.</p>
        <ToneContour text="Ẹ kú àbọ̀" className="mt-3" animate />
        <p className="mt-4 max-w-sm text-muted">
          {aside ?? "Welcome — in Yoruba. Pick up where you left off."}
        </p>
      </div>
      <div className="w-full max-w-md justify-self-center md:justify-self-end">
        <h1 className="mb-6 text-3xl font-extrabold">{title}</h1>
        {children}
      </div>
    </div>
  );
}
