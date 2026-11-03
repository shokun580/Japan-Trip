"use client";
import { useSyncExternalStore } from "react";
import { APP_VERSION } from "./changelog";

// Which version's notes this phone has opened. A new version brings the red dot
// back until the page is read again.
const KEY = "japan-trip.changelog.seen";
const EVENT = "japan-trip:changelog";

const read = () => { try { return window.localStorage.getItem(KEY); } catch { return null; } };
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(EVENT, listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener(EVENT, listener); };
}

// false on the server and before hydration, so the dot never flashes.
export function useUnreadChangelog() {
  return useSyncExternalStore(subscribe, () => read() !== APP_VERSION, () => false);
}

export function markChangelogRead() {
  try { window.localStorage.setItem(KEY, APP_VERSION); } catch { /* nothing to remember it with */ }
  window.dispatchEvent(new Event(EVENT));
}
