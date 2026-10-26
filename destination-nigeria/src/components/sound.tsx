"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useSyncExternalStore } from "react";

/**
 * Welcome-sound preference. Sound is off until the visitor turns it on with an
 * explicit action; the choice is remembered in localStorage ("dn:sound") on
 * this device only. The sonic logo plays once per activation, never on route
 * changes, and never automatically on page load.
 */

const KEY = "dn:sound";
const listeners = new Set<() => void>();

function readPref(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

type Ctx = { enabled: boolean; setEnabled: (on: boolean, opts?: { play?: boolean }) => void; play: () => void };
const SoundContext = createContext<Ctx>({ enabled: false, setEnabled: () => {}, play: () => {} });

export function SoundProvider({ children }: { children: React.ReactNode }) {
  // Restoring a saved preference only arms the toggle; it never auto-plays.
  const enabled = useSyncExternalStore(subscribe, readPref, () => false);
  const audio = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    try {
      if (!audio.current) {
        const a = new Audio();
        a.preload = "auto";
        a.src = a.canPlayType('audio/ogg; codecs="opus"') ? "/audio/welcome.ogg" : "/audio/welcome.mp3";
        a.volume = 0.7;
        audio.current = a;
      }
      audio.current.currentTime = 0;
      void audio.current.play().catch(() => {
        /* blocked or unsupported: the site works without sound */
      });
    } catch {
      /* Audio unavailable */
    }
  }, []);

  const setEnabled = useCallback(
    (on: boolean, opts?: { play?: boolean }) => {
      try {
        localStorage.setItem(KEY, on ? "on" : "off");
      } catch {
        /* storage unavailable */
      }
      listeners.forEach((l) => l());
      if (on && opts?.play !== false) play();
      if (!on) audio.current?.pause();
    },
    [play],
  );

  const value = useMemo(() => ({ enabled, setEnabled, play }), [enabled, setEnabled, play]);
  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export const useSound = () => useContext(SoundContext);

export function SoundToggle({ className = "icon-btn sound-toggle" }: { className?: string }) {
  const { enabled, setEnabled } = useSound();
  return (
    <button
      type="button"
      className={className}
      aria-pressed={enabled}
      onClick={() => setEnabled(!enabled)}
      title={enabled ? "Welcome sound on. Select to mute." : "Welcome sound off. Select to turn on and play it."}
    >
      <span className="sound-bars" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="visually-hidden">Welcome sound</span>
    </button>
  );
}
