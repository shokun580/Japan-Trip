import Link from "next/link";
import { ChevronRight, Vote } from "lucide-react";
import type { PersonKey } from "@/lib/people";
import type { PollData, StayData, TripData } from "@/lib/types";
import type { ForecastByDate } from "@/lib/weather";
import { OWNER } from "@/lib/people";
import { shortThaiDate } from "@/lib/format";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";
import { ChecklistButton } from "./checklist-button";
import { FlightCard } from "./flight-card";
import { NextUp } from "./next-up";
import { WeatherStrip } from "./weather";

// The home page: what matters today, top to bottom — the next thing on the plan,
// the flights, any poll still waiting, the weather ahead and the packing list.
export function Dashboard({ trip, person, stay, polls, forecast, today }: { trip: TripData; person: PersonKey; stay: StayData | null; polls: PollData[]; forecast: ForecastByDate; today: string }) {
  const open = polls.filter((p) => !p.closedAt);
  const waiting = open.filter((p) => !p.myVote);
  const dates = `${shortThaiDate(trip.startDate)} – ${shortThaiDate(trip.endDate)}`;

  return <main className="shell">
    <div className="page-enter">
      <AppHeader name={trip.name} dates={dates} person={person}/>
      <NextUp trip={trip}/>
      <div className="mt-3"><FlightCard outbound={trip.outbound} inbound={trip.inbound}/></div>
      {open.length > 0 && <Link href="/vote" className="card mt-3 flex items-center gap-3 p-4 transition-transform active:scale-[.99]" aria-label="ไปหน้าโหวต">
        <span className="flight-icon" data-tone={waiting.length ? "accent" : undefined}><Vote size={21}/></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{waiting.length ? `${waiting.length} โหวตรอคุณอยู่` : `${open.length} โหวตเปิดอยู่`}</span>
          <span className="block truncate text-[.82rem] text-[var(--muted)]">{(waiting[0] ?? open[0]).question}</span>
        </span>
        <ChevronRight size={20} className="shrink-0 text-[var(--muted)]"/>
      </Link>}
      <WeatherStrip days={trip.days} forecast={forecast} today={today}/>
      <div className="mt-3"><ChecklistButton person={person}/></div>
    </div>
    <BottomNav mapUrl={stay?.mapUrl ?? null} name={stay?.name} canManage={person === OWNER}/>
  </main>;
}
