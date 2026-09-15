"use client";
import { useEffect } from "react";

// Browsers restore the previous scroll offset on reload, so F5 landed mid-timeline.
// Opting out means every load starts at the trip name and flights instead.
export function StartAtTop() {
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);
  return null;
}
