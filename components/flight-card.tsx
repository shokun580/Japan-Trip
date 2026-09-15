"use client";
import { ChevronDown, PlaneLanding, PlaneTakeoff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { shortThaiDate } from "@/lib/format";
import { departureAt } from "@/lib/timeline";
import type { FlightData } from "@/lib/types";

function countdownLabel(target: Date, now: Date) {
  const ms = target.getTime() - now.getTime();
  const hours = Math.floor(ms / 3_600_000), days = Math.floor(hours / 24);
  if (days > 0) return `อีก ${days} วัน ${hours % 24} ชม.`;
  if (hours > 0) return `อีก ${hours} ชม. ${Math.floor(ms / 60_000) % 60} นาที`;
  return `อีก ${Math.max(1, Math.floor(ms / 60_000))} นาที`;
}

export function FlightCard({ outbound, inbound }: { outbound: FlightData; inbound: FlightData }) {
  const [now, setNow] = useState(() => new Date());
  const [open, setOpen] = useState(false);
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
  // Collapsed, the card shows the leg that matters now — the next departure, or the
  // final one once the whole trip has flown.
  const shown = open ? legs : [next ?? legs[legs.length - 1]];

  return <section className="flight-card" aria-label="เที่ยวบินขาไปและขากลับ">
    {legs.length > 1
      ? <button type="button" className="flight-card-head" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span className="flight-card-title">Flights</span>
          <span className="flight-card-toggle">{open ? "ย่อ" : "ดูทั้งหมด"}<ChevronDown size={15} className={open ? "rotate-180 transition-transform" : "transition-transform"}/></span>
        </button>
      : <p className="flight-card-title">Flights</p>}

    {shown.map((leg) => <div key={leg.direction} className="flight-leg-row">
      <span className="flight-icon"><leg.Icon size={21}/></span>
      <div className="min-w-0 flex-1">
        <p className="text-[.72rem] tracking-[.14em] text-[var(--on-dark-soft)] uppercase">{leg.label}</p>
        <p className="mt-0.5 truncate text-[1.02rem] font-semibold">{shortThaiDate(leg.date)} · {leg.time} น.</p>
      </div>
      {leg === next
        ? <span className="flight-pill">{countdownLabel(leg.at, now)}</span>
        : leg.at.getTime() <= now.getTime() ? <span className="flight-pill">ออกเดินทางแล้ว</span> : null}
    </div>)}

    {open && <p className="mt-3 text-[.74rem] text-[var(--on-dark-soft)]">เวลาท้องถิ่นของสนามบินต้นทางแต่ละขา</p>}
  </section>;
}
