import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

/** Distraction-free layout for onboarding, lessons and the speaking room. */
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center px-4 no-print">
        <Link href="/home" aria-label="Over Sabi home">
          <Logo size={26} />
        </Link>
      </header>
      <main id="main" className="flex-1 px-4 pb-16 pt-4">
        {children}
      </main>
    </div>
  );
}
