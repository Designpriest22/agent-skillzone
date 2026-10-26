"use client";

import { useEffect } from "react";
import { type AnalyticsEvent, track } from "@/lib/analytics";

/** Fires one analytics event when a page is viewed (subject to consent). */
export function TrackView({ event, props }: { event: AnalyticsEvent; props?: Record<string, string> }) {
  const key = JSON.stringify(props ?? {});
  useEffect(() => {
    track(event, JSON.parse(key) as Record<string, string>);
  }, [event, key]);
  return null;
}
