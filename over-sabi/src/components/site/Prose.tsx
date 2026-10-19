import type { ReactNode } from "react";

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="flex max-w-3xl flex-col gap-4 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h3]:mt-4 [&_h3]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_a]:underline [&_p]:text-[1.02rem] [&_table]:text-sm [&_td]:border-b [&_td]:border-border [&_td]:py-2 [&_td]:pr-4 [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left">
      {children}
    </div>
  );
}
