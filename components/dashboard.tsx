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
// the flights, polls, the weather ahead and the packing list. Every section keeps
// its place and its label whether or not it has anything to show yet, so the eye
// learns where each thing lives.
// A section with nothing in it yet keeps its card, so the layout holds still.
function Empty({ label, text, href }: { label: string; text: string; href?: string }) {
  const body = <><span className="min-w-0 flex-1"><span className="eyebrow block">{label}</span><span className="block truncate text-[.92rem] text-[var(--muted)]">{text}</span></span>{href && <ChevronRight size={20} className="shrink-0 text-[var(--muted)]"/>}</>;
  return href
    ? <Link href={href} className="card flex items-center gap-3 border-dashed px-4 py-3">{body}</Link>
    : <div className="card flex items-center gap-3 border-dashed px-4 py-3">{body}</div>;
}

export function Dashboard({ trip, person, stay, polls, forecast, today }: { trip: TripData; person: PersonKey; stay: StayData | null; polls: PollData[]; forecast: ForecastByDate; today: string }) {
  const open = polls.filter((p) => !p.closedAt);
  const waiting = open.filter((p) => !p.myVote);
  const dates = `${shortThaiDate(trip.startDate)} – ${shortThaiDate(trip.endDate)}`;
  const hasFlights = [trip.outbound, trip.inbound].some((f) => f.date && f.takeoffTime);

  // On a phone the page is laid out to the screen (see .home in globals.css): no
  // scrolling, the "next up" card takes whatever height is left.
  return <main className="shell home">
    <div className="page-enter">
      <AppHeader name={trip.name} dates={dates} compact/>
      <NextUp trip={trip}/>
      <div className="mt-3">{hasFlights
        ? <FlightCard outbound={trip.outbound} inbound={trip.inbound}/>
        : <Empty label="เที่ยวบิน" text="ยังไม่ได้ตั้งเวลาเที่ยวบิน" href={person === OWNER ? "/manage/flight" : undefined}/>}</div>
      <Link href="/vote" className="card mt-3 flex items-center gap-3 px-4 py-3 transition-transform active:scale-[.99]" aria-label="ไปหน้าโหวต">
        <span className="flight-icon" data-tone={waiting.length ? "accent" : undefined}><Vote size={20}/></span>
        <span className="min-w-0 flex-1">
          <span className="eyebrow block">โหวต</span>
          <span className="block truncate text-[.92rem] font-medium">{waiting.length ? `${waiting.length} โหวตรอคุณอยู่ · ${waiting[0].question}` : open.length ? `${open.length} โหวตเปิดอยู่ · ${open[0].question}` : "ยังไม่มีโหวตที่เปิดอยู่"}</span>
        </span>
        <ChevronRight size={20} className="shrink-0 text-[var(--muted)]"/>
      </Link>
      <WeatherStrip days={trip.days} forecast={forecast} today={today}/>
      <div className="mt-3"><ChecklistButton person={person}/></div>
    </div>
    <BottomNav mapUrl={stay?.mapUrl ?? null} name={stay?.name} canManage={person === OWNER}/>
  </main>;
}
