"use client";
import { useSyncExternalStore } from "react";

export type TokyoNow = { date: string; time: string; minutes: number };

function readTokyoNow(): TokyoNow {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

let snapshot: TokyoNow | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  if (listeners.size === 0) snapshot = readTokyoNow();
  listeners.add(listener);
  timer ??= setInterval(() => { snapshot = readTokyoNow(); listeners.forEach((l) => l()); }, 60_000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) { clearInterval(timer); timer = undefined; }
  };
}

// The server snapshot is null so the first paint matches the server markup; the real
// clock arrives right after hydration. Every consumer reads one shared snapshot, so
// the bullets and the "now" line can never disagree about the time.
export function useTokyoNow() {
  return useSyncExternalStore(subscribe, () => snapshot, () => null);
}

export const todayTokyo = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
