"use client";
import { MapPinned, PlaneLanding, PlaneTakeoff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CurrentTime } from "./current-time";
import { durationLabel, hasPassed, toMinutes, type TimelineEntry } from "@/lib/timeline";
import { useTokyoNow } from "@/lib/use-tokyo-now";

// Interpolate between the bullets either side of "now". Rows grow with their text, so
// the positions have to come from the real layout — assuming a fixed row height once put
// the marker on the wrong side of a bullet.
function indicatorTop(entries: TimelineEntry[], minutes: number, centers: number[]) {
  if (centers.length !== entries.length) return null;
  if (minutes <= toMinutes(entries[0].time)) return centers[0];
  for (let i = 0; i < entries.length - 1; i++) {
    const from = toMinutes(entries[i].time), to = toMinutes(entries[i + 1].time);
    if (minutes <= to) return centers[i] + (centers[i + 1] - centers[i]) * ((minutes - from) / Math.max(1, to - from));
  }
  return centers[centers.length - 1];
}

export function Timeline({ date, entries }: { date: string; entries: TimelineEntry[] }) {
  const now = useTokyoNow();
  const frame = useRef<HTMLElement>(null);
  const [centers, setCenters] = useState<number[]>([]);

  useEffect(() => {
    const section = frame.current;
    if (!section) return;
    const measure = () => {
      const base = section.getBoundingClientRect().top;
      setCenters([...section.querySelectorAll<HTMLElement>("[data-bullet]")].map((dot) => {
        const box = dot.getBoundingClientRect();
        return box.top + box.height / 2 - base;
      }));
    };
    // Fires once on observe, then whenever reflow changes the row heights.
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    return () => observer.disconnect();
  }, [entries]);

  if (!entries.length) return <div className="card mt-4 grid min-h-48 place-items-center px-6 text-center text-[var(--muted)]"><div><p className="text-4xl">🍵</p><p className="mt-3 font-medium">ยังไม่มีกิจกรรมสำหรับวันนี้</p><p className="mt-1 text-[.9rem]">พักสบาย ๆ หรือเพิ่มกิจกรรมในเมนูจัดการแผนเที่ยว</p></div></div>;

  // Only the day being shown today gets a marker; otherwise there is no "now" on it.
  const markerTop = now && now.date === date ? indicatorTop(entries, now.minutes, centers) : null;

  return <section ref={frame} className="relative mt-5" aria-label="กำหนดการรายวัน">
    <div className="absolute top-5 bottom-4 left-[59px] w-px bg-[var(--line-strong)] sm:left-[72px]" />
    {markerTop !== null && <CurrentTime day={date} top={markerTop} />}
    <ol className="space-y-3 sm:space-y-4">{entries.map((entry, i) => {
      const passed = hasPassed(entry.time, date, now);
      const bullet = passed === null ? "border-[var(--ink)] bg-[var(--paper)]" : passed ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--line-strong)] bg-[var(--card)]";
      // Hide this row's own time when the "now" label would sit on top of it.
      const timeHidden = markerTop !== null && centers[i] !== undefined && Math.abs(markerTop - centers[i]) < 13;
      return <li key={entry.id} className="relative grid min-h-[122px] grid-cols-[47px_1fr] gap-8 sm:grid-cols-[56px_1fr] sm:gap-10">
        {/* invisible, not hidden: display:none would drop it out of the grid and let the card fall into the time column. */}
        <time className={`pt-4 text-right text-[.82rem] font-semibold tabular-nums sm:text-sm ${timeHidden ? "invisible" : ""}`}>{entry.time}</time>
        <span data-bullet className={`absolute top-[22px] left-[53px] h-[13px] w-[13px] rounded-full border-[3px] transition-colors sm:left-[66px] ${bullet}`} />
        {entry.kind === "flight"
          ? <article className={`flight-leg flex flex-wrap content-center items-center justify-between gap-x-5 gap-y-3 ${passed === false ? "opacity-70" : ""}`}>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[.72rem] tracking-[.14em] text-[var(--on-dark-soft)] uppercase"><PlaneTakeoff size={16}/>{entry.label}</p>
                <p className="mt-1.5 flex items-center gap-2 text-[1.12rem] font-semibold tabular-nums">{entry.time}{entry.landingTime && <><span className="text-[var(--on-dark-faint)]">→</span>{entry.landingTime}<PlaneLanding size={16} className="text-[var(--on-dark-soft)]"/></>}<span className="text-[.9rem] font-normal text-[var(--on-dark-soft)]">น.</span></p>
              </div>
              {entry.minutes !== null
                ? <span className="rounded-full bg-[var(--sky)] px-3 py-1.5 text-[.75rem] font-semibold whitespace-nowrap text-[var(--ink)]">อยู่บนเครื่อง {durationLabel(entry.minutes)}</span>
                : <span className="text-[.8rem] text-[var(--on-dark-soft)]">ยังไม่ได้ระบุเวลาถึง</span>}
            </article>
          : <article className={`card p-4 ${passed === false ? "opacity-70" : ""}`}><h3 className="text-[1.08rem] font-semibold">{entry.activity.name}</h3>{entry.activity.description && <p className="mt-1.5 text-[.96rem] leading-relaxed text-[var(--muted)]">{entry.activity.description}</p>}{entry.activity.mapUrl && <a className="tap mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--sky)] px-4 py-2 text-[.92rem] font-medium sm:w-auto" href={entry.activity.mapUrl} target="_blank" rel="noopener noreferrer"><MapPinned size={20} />เปิดแผนที่</a>}</article>}
      </li>;
    })}</ol>
  </section>;
}
