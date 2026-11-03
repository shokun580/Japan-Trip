import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PersonKey } from "@/lib/people";
import type { StayData, TripData } from "@/lib/types";
import type { ForecastByDate } from "@/lib/weather";
import type { YenRate } from "@/lib/rates";
import { OWNER } from "@/lib/people";
import { shortThaiDate } from "@/lib/format";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";
import { ChecklistButton } from "./checklist-button";
import { FlightCard } from "./flight-card";
import { NextUp } from "./next-up";
import { WeatherStrip } from "./weather";
import { Money } from "./money";
import type { HomeSection } from "@/lib/home-layout";

// The home page: what matters today, top to bottom — the next thing on the plan,
// the flights, the weather ahead, yen in baht, and the packing list. Every section
// keeps its place and its label whether or not it has anything to show yet, so the
// eye learns where each thing lives. Polls live behind their slot in the bar, which
// shows a dot when one is waiting.
// A section with nothing in it yet keeps its card, so the layout holds still.
function Empty({ label, text, href }: { label: string; text: string; href?: string }) {
  const body = <><span className="min-w-0 flex-1"><span className="eyebrow block">{label}</span><span className="block truncate text-[.92rem] text-[var(--muted)]">{text}</span></span>{href && <ChevronRight size={20} className="shrink-0 text-[var(--muted)]"/>}</>;
  return href
    ? <Link href={href} className="card flex items-center gap-3 border-dashed px-4 py-3">{body}</Link>
    : <div className="card flex items-center gap-3 border-dashed px-4 py-3">{body}</div>;
}

export function Dashboard({ trip, person, stay, forecast, rate, today, order }: { trip: TripData; person: PersonKey; stay: StayData | null; forecast: ForecastByDate; rate: YenRate | null; today: string; order: HomeSection[] }) {
  const dates = `${shortThaiDate(trip.startDate)} – ${shortThaiDate(trip.endDate)}`;
  const hasFlights = [trip.outbound, trip.inbound].some((f) => f.date && f.takeoffTime);
  const sections: Record<HomeSection, React.ReactNode> = {
    next: <NextUp key="next" trip={trip}/>,
    flights: hasFlights
      ? <FlightCard key="flights" outbound={trip.outbound} inbound={trip.inbound}/>
      : <Empty key="flights" label="เที่ยวบิน" text="ยังไม่ได้ตั้งเวลาเที่ยวบิน" href={person === OWNER ? "/manage/flight" : undefined}/>,
    weather: <WeatherStrip key="weather" days={trip.days} forecast={forecast} today={today}/>,
    money: <Money key="money" rate={rate}/>,
    checklist: <ChecklistButton key="checklist" person={person}/>,
  };

  // On a phone the page is laid out to the screen (see .home in globals.css): no
  // scrolling, the "next up" card takes whatever height is left. The order is each
  // person's own, from the settings page.
  return <main className="shell home">
    <div className="page-enter flex flex-col gap-2.5">
      <AppHeader name={trip.name} dates={dates} compact/>
      {order.map((key) => sections[key])}
    </div>
    <BottomNav mapUrl={stay?.mapUrl ?? null} name={stay?.name} canManage={person === OWNER}/>
  </main>;
}
