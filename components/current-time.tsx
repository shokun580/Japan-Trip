"use client";
import { useTokyoNow } from "@/lib/use-tokyo-now";

export function CurrentTime({ day, top }: { day: string; top: number }) {
  const now = useTokyoNow();
  if (!now || now.date !== day) return null;
  // No z-index on purpose: the cards come later in the DOM, so the line slips behind
  // them instead of striking through their text. Only the gutter part stays visible.
  return <div className="pointer-events-none absolute right-0 left-[54px] flex -translate-y-1/2 items-center sm:left-[66px]" style={{ top: `${top}px` }} aria-label={`เวลาปัจจุบัน ${now.time}`}>
    <span className="-ml-[52px] w-[44px] text-right text-xs font-semibold text-[var(--ink)] sm:-ml-[62px] sm:w-[54px] sm:text-sm">{now.time}</span>
    <span className="ml-2 h-3 w-3 rounded-full bg-[var(--accent)] ring-4 ring-[var(--accent-ring)]"/>
    <span className="h-[2px] flex-1 bg-[var(--accent)]"/>
  </div>;
}
