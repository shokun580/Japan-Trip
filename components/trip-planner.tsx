"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { StayData, TripData } from "@/lib/types";
import type { ForecastByDate } from "@/lib/weather";
import { OWNER, type PersonKey } from "@/lib/people";
import { dayLabel } from "@/lib/format";
import { BottomNav } from "./bottom-nav"; import { Timeline } from "./timeline";
import { DayShift } from "./day-shift";
import { WeatherLine } from "./weather";
import { dayEntries } from "@/lib/timeline";
import { todayTokyo } from "@/lib/use-tokyo-now";

// The whole trip, one day at a time. Opens on the day asked for, else today.
export function TripPlanner({ trip, person, stay, forecast, initialDayId }: { trip: TripData; person: PersonKey; stay: StayData | null; forecast: ForecastByDate; initialDayId: string | null }) {
  const asked = trip.days.findIndex((d) => d.id === initialDayId);
  const today = trip.days.findIndex((d) => d.date === todayTokyo());
  const [index, setIndex] = useState(Math.max(0, asked >= 0 ? asked : today));
  // Which way the last day change went, so the new day slides in from that side.
  // null on first render: the page entrance already covers that.
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);
  const goTo = (target: number) => { if (target === index) return; setDirection(target > index ? "next" : "prev"); setIndex(target); };

  const day = trip.days[index];
  const entries = useMemo(() => (day ? dayEntries(trip, day) : []), [trip, day]);

  return <main className="shell">
    {/* The bottom bar stays outside the animated wrapper: see .page-enter. */}
    <div className="page-enter">
    <p className="eyebrow">Itinerary</p>
    <h1 className="text-2xl font-bold">แผนเที่ยว</h1>
    {day ? <>
      <section className="day-control sticky z-20 mt-4 p-3 sm:p-4" aria-label="เลือกวัน">
        <div className="flex items-center gap-2">
          <button className="tap grid place-items-center rounded-xl border border-[var(--line)] disabled:opacity-30" disabled={index === 0} onClick={() => goTo(index - 1)} aria-label="วันก่อนหน้า"><ChevronLeft /></button>
          <p className="min-w-0 flex-1 truncate px-1 text-center text-[1.05rem] font-semibold">{dayLabel(day.date)} • {day.title}</p>
          <button className="tap grid place-items-center rounded-xl border border-[var(--line)] disabled:opacity-30" disabled={index === trip.days.length - 1} onClick={() => goTo(index + 1)} aria-label="วันถัดไป"><ChevronRight /></button>
        </div>
        <div className="mt-2 flex items-center justify-center gap-1.5" aria-label={`วันที่ ${index + 1} จาก ${trip.days.length}`}>{trip.days.map((d, i) => <button key={d.id} onClick={() => goTo(i)} aria-label={`ไปวันที่ ${i + 1} ${dayLabel(d.date)}`} className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-[var(--accent)]" : "w-2 bg-[var(--line-strong)]"}`}/>)}</div>
      </section>
      <div key={day.id} className="day-enter" data-dir={direction ?? undefined}>
      <div className="mt-5 flex items-end justify-between">
        <div><p className="eyebrow">Day {index + 1}</p><h2 className="mt-1 text-[1.45rem] font-bold tracking-tight">{day.title}</h2><WeatherLine forecast={forecast[day.date]}/></div>
        <p className="rounded-full bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--ink)]">{entries.length} กิจกรรม</p>
      </div>
      {person === OWNER && <div className="mt-3"><DayShift day={day} compact/></div>}
      <Timeline date={day.date} entries={entries} />
      </div>
    </> : <p>ยังไม่มีวันเดินทาง</p>}
    </div>
    <BottomNav mapUrl={stay?.mapUrl ?? null} name={stay?.name} canManage={person === OWNER} />
  </main>;
}
