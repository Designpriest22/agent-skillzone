import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/session";

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/languages", label: "Languages" },
  { href: "/tutors", label: "Tutors" },
  { href: "/pricing", label: "Pricing" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/90 backdrop-blur no-print">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="Over Sabi home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 text-sm font-medium md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-muted hover:text-text">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <ButtonLink href="/home" size="sm">
              Open app
            </ButtonLink>
          ) : (
            <>
              <Link href="/signin" className="hidden px-3 text-sm font-semibold sm:inline">
                Sign in
              </Link>
              <ButtonLink href="/start" size="sm">
                Start learning
              </ButtonLink>
            </>
          )}
        </div>
      </div>
      <nav
        aria-label="Main (mobile)"
        className="flex gap-5 overflow-x-auto px-4 pb-2 text-sm font-medium md:hidden"
      >
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="shrink-0 text-muted hover:text-text">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
