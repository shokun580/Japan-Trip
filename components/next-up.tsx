"use client";
import Link from "next/link";
import { ChevronRight, MapPinned } from "lucide-react";
import { useState } from "react";
import type { TripData } from "@/lib/types";
import { dayLabel } from "@/lib/format";
import { dayEntries, toMinutes, type TimelineEntry } from "@/lib/timeline";
import { useTokyoNow } from "@/lib/use-tokyo-now";
import { Timeline } from "./timeline";

const WHOLE_DAY = "japan-trip.home.whole-day";
const readWholeDay = () => { try { return window.localStorage.getItem(WHOLE_DAY) === "1"; } catch { return false; } };
const writeWholeDay = (on: boolean) => { try { window.localStorage.setItem(WHOLE_DAY, on ? "1" : "0"); } catch { /* nothing to remember it with */ } };

const untilLabel = (minutes: number) => {
  if (minutes < 1) return "ตอนนี้";
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return `อีก ${h ? `${h} ชม.` : ""}${h && m ? " " : ""}${m ? `${m} นาที` : ""}`;
};
const title = (entry: TimelineEntry) => (entry.kind === "flight" ? entry.label : entry.activity.name);

// The first thing on the home page: where the day stands right now. What is going
// on, what comes next and in how long, and the way to the full plan. Before the
// trip it counts the days down; after it, it says goodbye.
export function NextUp({ trip }: { trip: TripData }) {
  const now = useTokyoNow();
  const [wholeDay, setWholeDay] = useState(() => (typeof window === "undefined" ? false : readWholeDay()));
  const toggle = () => { setWholeDay((v) => { writeWholeDay(!v); return !v; }); };

  // Null before hydration: the card holds its shape so nothing jumps.
  if (!now) return <section className="card hero p-4 sm:p-5" aria-busy="true"><p className="eyebrow">วันนี้</p><div className="skeleton-line mt-3 h-6 w-48"/><div className="skeleton-line mt-2 h-4 w-32"/></section>;

  const today = trip.days.find((d) => d.date === now.date);
  const daysUntil = Math.round((Date.parse(trip.startDate) - Date.parse(now.date)) / 86_400_000);

  if (!today) {
    const first = trip.days[0];
    const after = now.date > trip.endDate;
    return <section className="card hero p-4 sm:p-5">
      <p className="eyebrow">{after ? "จบทริปแล้ว" : "ก่อนออกเดินทาง"}</p>
      <h2 className="mt-1 text-[1.3rem] leading-snug font-bold">{after ? "กลับถึงบ้านแล้ว เก็บความทรงจำดีๆ ไว้นะ" : daysUntil === 1 ? "พรุ่งนี้ออกเดินทางแล้ว" : `อีก ${daysUntil} วันออกเดินทาง`}</h2>
      {!after && first && <p className="mt-1 text-[.92rem] text-[var(--muted)]">วันแรก {dayLabel(first.date)} · {first.title}</p>}
      <Link href="/plan" className="tap mt-3 inline-flex items-center gap-1 rounded-xl bg-[var(--sky)] px-4 text-[.92rem] font-medium">ดูแผนทั้งทริป<ChevronRight size={18}/></Link>
    </section>;
  }

  const entries = dayEntries(trip, today);
  const current = [...entries].reverse().find((e) => toMinutes(e.time) <= now.minutes);
  const next = entries.find((e) => toMinutes(e.time) > now.minutes);
  const tomorrow = trip.days[trip.days.indexOf(today) + 1];
  const tomorrowFirst = tomorrow ? dayEntries(trip, tomorrow)[0] : undefined;
  const lead = next ?? current;
  const map = lead?.kind === "activity" ? lead.activity.mapUrl : null;

  return <section className="card hero flex flex-col p-4 sm:p-5" aria-label="ตอนนี้และถัดไป">
    <Link href={`/plan?day=${today.id}`} className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="eyebrow">วันนี้ · Day {trip.days.indexOf(today) + 1}</p>
        <p className="truncate text-[.92rem] font-medium">{dayLabel(today.date)} · {today.title}</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-0.5 text-[.85rem] font-medium text-[var(--muted)]">ดูทั้งทริป<ChevronRight size={17}/></span>
    </Link>

    <div className="mt-4">
      {next
        ? <>
            <p className="text-[.78rem] font-medium text-[var(--accent)]">ถัดไป · {untilLabel(toMinutes(next.time) - now.minutes)}</p>
            <h2 className="mt-0.5 text-[1.35rem] leading-snug font-bold"><span className="tabular-nums">{next.time}</span> {title(next)}</h2>
            {next.kind === "activity" && next.activity.description && <p className="mt-1 line-clamp-2 text-[.92rem] text-[var(--muted)]">{next.activity.description}</p>}
          </>
        : entries.length
          ? <>
              <p className="text-[.78rem] font-medium text-[var(--muted)]">หมดแผนของวันนี้แล้ว</p>
              <h2 className="mt-0.5 text-[1.35rem] leading-snug font-bold">พักผ่อนได้เลย</h2>
              {tomorrowFirst && tomorrow && <p className="mt-1 text-[.92rem] text-[var(--muted)]">พรุ่งนี้เริ่ม {tomorrowFirst.time} · {title(tomorrowFirst)}</p>}
            </>
          : <>
              <p className="text-[.78rem] font-medium text-[var(--muted)]">วันนี้ยังไม่มีแผน</p>
              <h2 className="mt-0.5 text-[1.35rem] leading-snug font-bold">วันว่าง ตามใจเลย</h2>
            </>}
      {current && next && <p className="mt-2 text-[.85rem] text-[var(--muted)]">ตอนนี้: <span className="tabular-nums">{current.time}</span> {title(current)}</p>}
    </div>

    <div className="mt-3 flex flex-wrap gap-2">
      {map && <a href={map} target="_blank" rel="noopener noreferrer" className="tap inline-flex items-center gap-2 rounded-xl bg-[var(--sky)] px-4 text-[.92rem] font-medium"><MapPinned size={19}/>เปิดแผนที่</a>}
      {entries.length > 0 && <button type="button" onClick={toggle} aria-pressed={wholeDay} className="tap inline-flex items-center gap-2 rounded-xl border border-[var(--line)] px-4 text-[.92rem] font-medium">{wholeDay ? "ย่อเหลือถัดไป" : "ดูทั้งวัน"}</button>}
    </div>

    {wholeDay && entries.length > 0 && <div className="hero-day -mx-1 px-1"><Timeline date={today.date} entries={entries}/></div>}
  </section>;
}
