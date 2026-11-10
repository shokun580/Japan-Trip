"use client";
import { useSyncExternalStore } from "react";
import { readClock, type ClockNow } from "./format";

let snapshot: ClockNow | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  if (listeners.size === 0) snapshot = readClock();
  listeners.add(listener);
  timer ??= setInterval(() => { snapshot = readClock(); listeners.forEach((l) => l()); }, 60_000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) { clearInterval(timer); timer = undefined; }
  };
}

// The server snapshot is null so the first paint matches the server markup; the real
// clock arrives right after hydration. Every consumer reads one shared snapshot, so
// the bullets and the "now" line can never disagree about the time. It is the phone's
// own clock (see readClock): Thai time while still in Thailand, Japan's once landed.
export function useNow() {
  return useSyncExternalStore(subscribe, () => snapshot, () => null);
}
