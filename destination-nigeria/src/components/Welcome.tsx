"use client";

import { useEffect, useRef, useState } from "react";
import { useSound } from "./sound";

const SEEN = "dn:welcomed";

/** Fired when the visitor has entered, so the hero can start its opening sequence. */
export const ENTERED_EVENT = "dn:entered";

export function welcomePending(): boolean {
  try {
    return localStorage.getItem(SEEN) !== "1";
  } catch {
    return false;
  }
}

/**
 * First-visit welcome. Shown once per device, only on the home page. Both
 * choices enter the site immediately; Escape is the same as "without sound".
 */
export function Welcome() {
  const ref = useRef<HTMLDialogElement>(null);
  const { setEnabled } = useSound();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (welcomePending()) ref.current?.showModal();
    else window.dispatchEvent(new Event(ENTERED_EVENT));
  }, []);

  function enter(withSound: boolean) {
    try {
      localStorage.setItem(SEEN, "1");
    } catch {
      /* storage unavailable: the welcome may show again next visit */
    }
    setEnabled(withSound, { play: withSound });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      ref.current?.close();
      window.dispatchEvent(new Event(ENTERED_EVENT));
      return;
    }
    setLeaving(true);
    window.setTimeout(() => {
      ref.current?.close();
      setLeaving(false);
      window.dispatchEvent(new Event(ENTERED_EVENT));
    }, 650);
  }

  return (
    <dialog
      ref={ref}
      className={`welcome on-dark${leaving ? " is-leaving" : ""}`}
      aria-labelledby="welcome-title"
      aria-describedby="welcome-desc"
      onCancel={(e) => {
        e.preventDefault();
        enter(false);
      }}
    >
      <div className="welcome-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/destination-nigeria-logo-reverse.svg" alt="Destination Nigeria" width={300} height={118} />
        <h2 id="welcome-title" className="display t-3">
          A nation of extraordinary experiences
        </h2>
        <p id="welcome-desc" className="muted">
          Destination Nigeria has a short welcome sound. Play it, or continue in silence. You can change this any time with the sound button in the menu bar.
        </p>
        <div className="cluster" style={{ justifyContent: "center" }}>
          <button type="button" className="btn btn--sun" onClick={() => enter(true)} autoFocus>
            Enter with sound
          </button>
          <button type="button" className="btn btn--ghost-light" onClick={() => enter(false)}>
            Enter without sound
          </button>
        </div>
      </div>
    </dialog>
  );
}
