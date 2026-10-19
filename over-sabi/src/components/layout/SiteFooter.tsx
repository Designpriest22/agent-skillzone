import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const COLUMNS = [
  {
    title: "Learn",
    links: [
      ["/try", "Try a lesson"],
      ["/languages", "Languages"],
      ["/tutors", "AI tutors"],
      ["/how-it-works", "How it works"],
    ],
  },
  {
    title: "Over Sabi",
    links: [
      ["/about", "About"],
      ["/pricing", "Pricing"],
      ["/brand", "Brand"],
      ["/contribute", "Contribute a language"],
    ],
  },
  {
    title: "Help",
    links: [
      ["/help", "Help & FAQs"],
      ["/privacy", "Privacy"],
      ["/terms", "Terms"],
      ["/status", "Service status"],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border no-print">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">Your language. Your people. Your voice.</p>
          <p className="mt-4 max-w-xs text-xs text-muted">
            Tutors on Over Sabi are AI characters. Learning content is labelled with its review status.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="font-mono text-xs uppercase tracking-wider text-muted">{col.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {col.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
