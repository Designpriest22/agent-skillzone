"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { primaryNav } from "@/content/site";
import { useShortlist } from "@/lib/shortlist";
import { SearchDialog } from "./SearchDialog";
import { SoundToggle } from "./sound";

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const menu = useRef<HTMLDialogElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const stops = useShortlist();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    menu.current?.close();
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.closest("input, textarea, select, [contenteditable]");
      if ((e.key === "/" && !typing) || (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="nav-bar glass">
        <Link href="/" className="nav-logo" aria-label="Destination Nigeria home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/destination-nigeria-logo-reverse.svg" alt="" width={150} height={59} />
        </Link>
        <nav aria-label="Main">
          <ul className="nav-links">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="nav-actions">
          <button type="button" className="icon-btn" onClick={() => setSearchOpen(true)} aria-haspopup="dialog">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="visually-hidden">Search</span>
          </button>
          <Link href="/plan#itinerary" className="icon-btn shortlist-count" aria-label={`Trip shortlist, ${stops.length} saved`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 3h12v18l-6-4-6 4z" />
            </svg>
            {stops.length > 0 ? (
              <span data-count aria-hidden="true">
                {stops.length}
              </span>
            ) : null}
          </Link>
          <SoundToggle />
          <Link href="/destinations" className="btn btn--sun btn--sm nav-cta">
            Explore Nigeria
          </Link>
          <button type="button" className="icon-btn nav-menu-btn" aria-haspopup="dialog" onClick={() => menu.current?.showModal()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
            <span className="visually-hidden">Menu</span>
          </button>
        </div>
      </div>

      <dialog ref={menu} className="menu-sheet" aria-label="Menu">
        <div className="container" style={{ paddingTop: "1.25rem", paddingBottom: "2rem" }}>
          <div className="cluster" style={{ justifyContent: "space-between", marginBottom: "2rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/destination-nigeria-logo-reverse.svg" alt="Destination Nigeria" width={130} height={51} />
            <button type="button" className="icon-btn" onClick={() => menu.current?.close()} autoFocus>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
              <span className="visually-hidden">Close menu</span>
            </button>
          </div>
          <nav aria-label="Main">
            <ul>
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined} onClick={() => menu.current?.close()}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="cluster" style={{ marginTop: "2rem" }}>
            <Link href="/destinations" className="btn btn--sun" onClick={() => menu.current?.close()}>
              Explore Nigeria
            </Link>
            <button
              type="button"
              className="btn btn--ghost-light"
              onClick={() => {
                menu.current?.close();
                setSearchOpen(true);
              }}
            >
              Search
            </button>
          </div>
        </div>
      </dialog>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
