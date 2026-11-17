import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { BottomNav, SideNav, type NavItem } from "@/components/layout/AppNav";
import {
  IconBell,
  IconHome,
  IconLearn,
  IconProgress,
  IconReview,
  IconSettings,
  IconShield,
  IconSpeak,
  IconTutors,
  IconVocab,
} from "@/components/ui/icons";
import { requirePageUser } from "@/lib/auth/guards";
import { hasRole } from "@/lib/auth/session";
import { withUser } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  const [counts] = await withUser(
    user.id,
    (tx) => tx`
    select (select count(*) from notifications where user_id = ${user.id} and read_at is null)::int as unread,
           (select count(*) from user_vocabulary where user_id = ${user.id} and due_at <= now())::int as due`,
  );
  const items: NavItem[] = [
    { href: "/home", label: "Home", icon: <IconHome />, mobile: true },
    { href: "/learn", label: "Learn", icon: <IconLearn />, mobile: true },
    { href: "/speak", label: "Speak", icon: <IconSpeak />, mobile: true },
    { href: "/speak/tutors", label: "Tutors", icon: <IconTutors /> },
    { href: "/vocabulary", label: "Vocabulary", icon: <IconVocab />, mobile: true },
    { href: "/review", label: counts?.due ? `Review (${counts.due})` : "Review", icon: <IconReview /> },
    { href: "/progress", label: "Progress", icon: <IconProgress />, mobile: true },
    { href: "/settings", label: "Settings", icon: <IconSettings /> },
  ];
  if (hasRole(user, "reviewer")) items.push({ href: "/admin", label: "Admin", icon: <IconShield /> });

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-border px-3 py-5 lg:flex">
        <Link href="/home" className="px-2" aria-label="Over Sabi home">
          <Logo />
        </Link>
        <SideNav items={items} />
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-bg/90 px-4 backdrop-blur no-print">
          <Link href="/home" className="lg:hidden" aria-label="Over Sabi home">
            <Logo size={26} />
          </Link>
          <span className="hidden lg:block" />
          <div className="flex items-center gap-1">
            <Link
              href="/notifications"
              className="relative rounded-full p-2 hover:bg-surface-2"
              aria-label={`Notifications${counts?.unread ? `, ${counts.unread} unread` : ""}`}
            >
              <span className="block h-5 w-5">
                <IconBell />
              </span>
              {counts?.unread ? (
                <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-ember" />
              ) : null}
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-surface-2"
              aria-label="Profile and settings"
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-full bg-primary font-display text-sm font-bold text-on-primary"
                aria-hidden
              >
                {(user.displayName || user.email).slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden text-sm font-medium sm:inline">{user.displayName || "Profile"}</span>
            </Link>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 lg:pb-12">
          {!user.emailVerified ? (
            <p className="mb-4 rounded-xl bg-surface-2 px-4 py-2 text-sm">
              Confirm your email to secure your account.{" "}
              <Link href="/settings#account" className="font-semibold underline">
                Resend the link
              </Link>
            </p>
          ) : null}
          {children}
        </main>
      </div>
      <BottomNav items={items} />
    </div>
  );
}
