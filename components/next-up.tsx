"use client";
import Link from "next/link";
import { ChevronRight, Compass, MapPinned } from "lucide-react";
import type { TripData } from "@/lib/types";
import { dayLabel } from "@/lib/format";
import { dayEntries, toMinutes, type TimelineEntry } from "@/lib/timeline";
import { useNow } from "@/lib/use-now";

const untilLabel = (minutes: number) => {
  if (minutes < 1) return "ตอนนี้";
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return `อีก ${h ? `${h} ชม.` : ""}${h && m ? " " : ""}${m ? `${m} นาที` : ""}`;
};
const title = (entry: TimelineEntry) => (entry.kind === "flight" ? entry.label : entry.activity.name);

// The next two things after it, so the card says where the day goes from here
// (one on a short screen, where the converter needs the room).
const UPCOMING = 2;
function Upcoming({ label, entries }: { label: string; entries: TimelineEntry[] }) {
  if (!entries.length) return null;
  return <div className="mt-2.5 border-t border-[var(--line)] pt-1.5">
    <p className="text-[.72rem] font-medium tracking-[.1em] text-[var(--muted)] uppercase">{label}</p>
    <ul className="hero-next mt-1 grid gap-1">{entries.map((e) => <li key={e.id} className="flex min-w-0 gap-2.5 text-[.9rem]">
      <span className="shrink-0 font-semibold tabular-nums">{e.time}</span>
      <span className="min-w-0 truncate">{title(e)}</span>
    </li>)}</ul>
  </div>;
}

// The first thing on the home page: where the day stands right now. What comes
// next and in how long, what follows it, and the way to the full plan. Before the
// trip it counts the days down over the first day's plan; after it, it says goodbye.
// It keeps its own height — the converter below takes whatever room is left.
export function NextUp({ trip }: { trip: TripData }) {
  const now = useNow();

  // Null before hydration: the card holds its shape so nothing jumps.
  if (!now) return <section className="card hero p-4 sm:p-5" aria-busy="true"><p className="eyebrow">ถัดไป</p><div className="skeleton-line mt-3 h-9 w-40"/><div className="skeleton-line mt-2 h-4 w-32"/><div className="skeleton-line mt-6 h-4 w-48"/><div className="skeleton-line mt-2 h-4 w-40"/></section>;

  const today = trip.days.find((d) => d.date === now.date);
  const daysUntil = Math.round((Date.parse(trip.startDate) - Date.parse(now.date)) / 86_400_000);

  if (!today) {
    const first = trip.days[0];
    const after = now.date > trip.endDate;
    return <section className="card hero flex flex-col px-4 pt-3 pb-3 sm:p-5" aria-label="ถัดไป">
      <Compass className="hero-mark" aria-hidden/>
      <Link href="/plan" className="flex items-center justify-between gap-3">
        <p className="eyebrow">ถัดไป · {after ? "จบทริปแล้ว" : "ก่อนออกเดินทาง"}</p>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-[.85rem] font-medium text-[var(--muted)]">ดูทั้งทริป<ChevronRight size={17}/></span>
      </Link>
      {after
        ? <h2 className="mt-3 text-[1.35rem] leading-snug font-bold">กลับถึงบ้านแล้ว เก็บความทรงจำดีๆ ไว้นะ</h2>
        : <div className="mt-1 flex items-end gap-2">
            <span className="hero-number">{daysUntil}</span>
            <span className="pb-2 text-[1.1rem] leading-tight font-semibold">{daysUntil === 1 ? "วัน · พรุ่งนี้ออกเดินทาง" : "วัน"}<span className="block text-[.85rem] font-normal text-[var(--muted)]">ถึงวันออกเดินทาง</span></span>
          </div>}
      {!after && first && <Upcoming label={`วันแรก · ${dayLabel(first.date)} ${first.title}`} entries={dayEntries(trip, first).slice(0, UPCOMING)}/>}
    </section>;
  }

  const entries = dayEntries(trip, today);
  const next = entries.find((e) => toMinutes(e.time) > now.minutes);
  const following = next ? entries.slice(entries.indexOf(next) + 1, entries.indexOf(next) + 1 + UPCOMING) : [];
  const tomorrow = trip.days[trip.days.indexOf(today) + 1];
  const map = next?.kind === "activity" ? next.activity.mapUrl : null;

  return <section className="card hero flex flex-col px-4 pt-3 pb-3 sm:p-5" aria-label="ถัดไป">
    <Compass className="hero-mark" aria-hidden/>
    <Link href={`/plan?day=${today.id}`} className="flex items-center justify-between gap-3">
      <p className="eyebrow truncate">ถัดไป · Day {trip.days.indexOf(today) + 1} · {today.title}</p>
      <span className="inline-flex shrink-0 items-center gap-0.5 text-[.85rem] font-medium text-[var(--muted)]">ดูทั้งทริป<ChevronRight size={17}/></span>
    </Link>

    {next
      ? <>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="hero-time">{next.time}</p>
            <span className="hero-pill">{untilLabel(toMinutes(next.time) - now.minutes)}</span>
          </div>
          <h2 className="mt-0.5 truncate text-[1.1rem] leading-snug font-bold">{title(next)}</h2>
          {map && <a href={map} target="_blank" rel="noopener noreferrer" className="tap mt-2 inline-flex items-center gap-2 rounded-xl bg-[var(--ink)] px-4 text-[.9rem] font-medium text-[var(--on-dark)]"><MapPinned size={18}/>เปิดแผนที่</a>}
          <Upcoming label="ต่อจากนั้น" entries={following}/>
        </>
      : <>
          <h2 className="mt-3 text-[1.35rem] leading-snug font-bold">{entries.length ? "หมดแผนของวันนี้แล้ว พักผ่อนได้เลย" : "วันนี้ยังไม่มีแผน ตามใจเลย"}</h2>
          {tomorrow && <Upcoming label={`พรุ่งนี้ · ${dayLabel(tomorrow.date)} ${tomorrow.title}`} entries={dayEntries(trip, tomorrow).slice(0, UPCOMING)}/>}
        </>}
  </section>;
}
