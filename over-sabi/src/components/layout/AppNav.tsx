"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  mobile?: boolean;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="App" className="flex flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium text-muted hover:bg-surface-2 hover:text-text aria-[current=page]:bg-primary aria-[current=page]:text-on-primary"
        >
          <span aria-hidden className="h-5 w-5">
            {item.icon}
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const mobile = items.filter((i) => i.mobile);
  return (
    <nav
      aria-label="App (mobile)"
      className="fixed inset-x-0 bottom-0 z-40 grid border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden no-print"
      style={{ gridTemplateColumns: `repeat(${mobile.length}, minmax(0, 1fr))` }}
    >
      {mobile.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold text-muted aria-[current=page]:text-primary"
        >
          <span aria-hidden className="h-5 w-5">
            {item.icon}
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
