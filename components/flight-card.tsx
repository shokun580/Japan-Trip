"use client";
import Link from "next/link";
import { ChevronRight, PlaneLanding, PlaneTakeoff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { shortThaiDate } from "@/lib/format";
import { countdownLabel, departureAt } from "@/lib/timeline";
import type { FlightData } from "@/lib/types";

// `all` shows both legs; the home page shows one and links here for the rest, so
// the card's height never changes under the cards below it.
export function FlightCard({ outbound, inbound, all = false }: { outbound: FlightData; inbound: FlightData; all?: boolean }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(timer); }, []);

  const legs = useMemo(() => ([
    { direction: "outbound" as const, label: "ขาไป", Icon: PlaneTakeoff, flight: outbound },
    { direction: "inbound" as const, label: "ขากลับ", Icon: PlaneLanding, flight: inbound },
  ]).flatMap(({ direction, label, Icon, flight }) => flight.date && flight.takeoffTime
    ? [{ direction, label, Icon, date: flight.date, time: flight.takeoffTime, at: departureAt(flight.date, flight.takeoffTime, direction) }]
    : []), [outbound, inbound]);

  if (!legs.length) return null;

  // Only the soonest leg still ahead carries the countdown. Once it departs the next
  // leg picks it up, and when none are left every row reads "ออกเดินทางแล้ว".
  const next = legs.find((leg) => leg.at.getTime() > now.getTime());
  // On the home page the card shows the leg that matters now — the next departure,
  // or the final one once the whole trip has flown.
  const shown = all ? legs : [next ?? legs[legs.length - 1]];

  return <section className="flight-card" aria-label="เที่ยวบินขาไปและขากลับ">
    {all
      ? <p className="flight-card-title">Flights</p>
      : <Link href="/flights" className="flight-card-head">
          <span className="flight-card-title">เที่ยวบิน</span>
          <span className="flight-card-toggle">ดูทั้งหมด<ChevronRight size={15}/></span>
        </Link>}

    {shown.map((leg) => <div key={leg.direction} className="flight-leg-row">
      <span className="flight-icon"><leg.Icon size={21}/></span>
      <div className="min-w-0 flex-1">
        <p className="text-[.72rem] tracking-[.14em] text-[var(--on-dark-soft)] uppercase">{leg.label}</p>
        <p className="flight-date mt-0.5 truncate text-[1.02rem] font-semibold">{shortThaiDate(leg.date)} · {leg.time} น.</p>
      </div>
      {leg === next
        ? <span className="flight-pill">{countdownLabel(leg.at, now)}</span>
        : leg.at.getTime() <= now.getTime() ? <span className="flight-pill">ออกเดินทางแล้ว</span> : null}
    </div>)}

    {all && <p className="mt-3 text-[.74rem] text-[var(--on-dark-soft)]">เวลาท้องถิ่นของสนามบินต้นทางแต่ละขา</p>}
  </section>;
}
