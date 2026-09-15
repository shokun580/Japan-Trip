"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { TripData } from "@/lib/types";
import { dayLabel, shortThaiDate } from "@/lib/format";
import { AppHeader } from "./app-header"; import { BottomNav } from "./bottom-nav"; import { Timeline } from "./timeline";
import { FlightCard } from "./flight-card";
import { dayEntries } from "@/lib/timeline";
import { todayTokyo } from "@/lib/use-tokyo-now";

export function TripPlanner({ trip }: { trip: TripData }) {
  // Today's date only picks which day the timeline opens on. The page itself always
  // starts at the very top so the trip name and flights are the first thing seen.
  const today = trip.days.findIndex((d) => d.date === todayTokyo());
  const [index, setIndex] = useState(Math.max(0, today));

  const day = trip.days[index];
  const dates = `${shortThaiDate(trip.startDate)} – ${shortThaiDate(trip.endDate)}`;
  const entries = useMemo(() => (day ? dayEntries(trip, day) : []), [trip, day]);

  return <main className="shell">
    <AppHeader name={trip.name} dates={dates} />
    <FlightCard outbound={trip.outbound} inbound={trip.inbound}/>
    {day ? <>
      <section className="day-control sticky z-20 mt-4 p-3 sm:p-4" aria-label="เลือกวัน">
        <div className="flex items-center gap-2">
          <button className="tap grid place-items-center rounded-xl border border-[var(--line)] bg-[var(--card)]/70 disabled:opacity-30" disabled={index === 0} onClick={() => setIndex(index - 1)} aria-label="วันก่อนหน้า"><ChevronLeft /></button>
          <label className="min-w-0 flex-1 text-center"><span className="sr-only">เลือกวันเดินทาง</span><select value={index} onChange={(e) => setIndex(Number(e.target.value))} className="tap w-full min-w-0 appearance-none rounded-xl bg-transparent px-1 text-center text-[1.05rem] font-semibold" aria-label="เลือกวันเดินทาง">{trip.days.map((d, i) => <option key={d.id} value={i}>{dayLabel(d.date)} • {d.title}</option>)}</select></label>
          <button className="tap grid place-items-center rounded-xl border border-[var(--line)] disabled:opacity-30" disabled={index === trip.days.length - 1} onClick={() => setIndex(index + 1)} aria-label="วันถัดไป"><ChevronRight /></button>
        </div>
        <div className="mt-2 flex items-center justify-center gap-1.5" aria-label={`วันที่ ${index + 1} จาก ${trip.days.length}`}>{trip.days.map((d, i) => <button key={d.id} onClick={() => setIndex(i)} aria-label={`ไปวันที่ ${i + 1} ${dayLabel(d.date)}`} className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-[var(--accent)]" : "w-2 bg-[var(--line-strong)]"}`}/>)}</div>
      </section>
      <div className="mt-5 flex items-end justify-between">
        <div><p className="eyebrow">Day {index + 1}</p><h2 className="mt-1 text-[1.45rem] font-bold tracking-tight">{day.title}</h2></div>
        <p className="rounded-full bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--ink)]">{entries.length} กิจกรรม</p>
      </div>
      <Timeline date={day.date} entries={entries} />
    </> : <p>ยังไม่มีวันเดินทาง</p>}
    <BottomNav mapUrl={trip.accommodation?.mapUrl ?? null} name={trip.accommodation?.name} />
  </main>;
}
