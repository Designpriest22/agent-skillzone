"use client";

import { useLayoutEffect, useRef, useState } from "react";
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

  // The dialog is server-rendered open (non-modal) so it paints immediately; an inline
  // script removes it before paint for returning visitors. On hydration it becomes a
  // true modal so focus is trapped and the page behind is inert.
  // Layout effect: upgrade to modal before the browser paints or handles input after hydration.
  useLayoutEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (welcomePending()) {
      if (d.open) d.close();
      d.showModal();
    } else if (d.open) {
      d.close();
    }
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
      window.dispatchEvent(new CustomEvent(ENTERED_EVENT, { detail: { fromWelcome: true } }));
      return;
    }
    setLeaving(true);
    window.setTimeout(() => {
      ref.current?.close();
      setLeaving(false);
      window.dispatchEvent(new CustomEvent(ENTERED_EVENT, { detail: { fromWelcome: true } }));
    }, 650);
  }

  return (
    <>
    <dialog
      id="dn-welcome"
      open
      suppressHydrationWarning
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
    <script dangerouslySetInnerHTML={{ __html: HIDE_IF_WELCOMED }} />
    <noscript>
      <style>{"#dn-welcome{display:none!important}"}</style>
    </noscript>
    </>
  );
}

/** Runs during HTML parsing, before first paint, so returning visitors never see the welcome flash. */
const HIDE_IF_WELCOMED = `try{if(localStorage.getItem('${SEEN}')==='1'){var w=document.getElementById('dn-welcome');if(w)w.removeAttribute('open')}}catch(e){}`;
