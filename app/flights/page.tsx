import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, PlaneLanding, PlaneTakeoff, Settings } from "lucide-react";
import { getStay, getTrip } from "@/lib/data";
import { OWNER } from "@/lib/people";
import { signedInPerson } from "@/lib/session";
import { shortThaiDate } from "@/lib/format";
import { durationLabel, flightMinutes } from "@/lib/timeline";
import { BottomNav } from "@/components/bottom-nav";
import { FlightCard } from "@/components/flight-card";

export const metadata: Metadata = { title: "เที่ยวบิน" };
export const dynamic = "force-dynamic";

// Both legs in full: the home page's card shows only the one that matters now.
export default async function FlightsPage() {
  const [person, trip] = await Promise.all([signedInPerson(), getTrip()]);
  const stay = await getStay(person, trip);
  const legs = [
    { key: "outbound" as const, label: "ขาไป", from: "กรุงเทพฯ", to: "โอซาก้า", Icon: PlaneTakeoff, flight: trip.outbound },
    { key: "inbound" as const, label: "ขากลับ", from: "โอซาก้า", to: "กรุงเทพฯ", Icon: PlaneLanding, flight: trip.inbound },
  ];
  return <main className="shell">
    <div className="page-enter">
      <Link href="/" className="tap -ml-2 inline-flex items-center gap-1 rounded-xl px-2 font-medium text-[var(--ink)]"><ChevronLeft size={22}/>หน้าหลัก</Link>
      <p className="eyebrow mt-4">Flights</p>
      <h1 className="text-2xl font-bold">เที่ยวบิน</h1>
      <div className="mt-4"><FlightCard outbound={trip.outbound} inbound={trip.inbound} all/></div>
      <ol className="mt-4 space-y-3">{legs.map(({ key, label, from, to, Icon, flight }) => <li key={key} className="card p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flight-icon"><Icon size={21}/></span>
          <div className="min-w-0 flex-1"><p className="eyebrow">{label}</p><p className="font-semibold">{from} → {to}</p></div>
        </div>
        {flight.date && flight.takeoffTime
          ? <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-[var(--paper)] px-2 py-2"><dt className="text-[.72rem] text-[var(--muted)]">ออก</dt><dd className="text-[1.05rem] font-semibold tabular-nums">{flight.takeoffTime}</dd><dd className="text-[.72rem] text-[var(--muted)]">{shortThaiDate(flight.date)}</dd></div>
              <div className="rounded-xl bg-[var(--paper)] px-2 py-2"><dt className="text-[.72rem] text-[var(--muted)]">ถึง</dt><dd className="text-[1.05rem] font-semibold tabular-nums">{flight.landingTime ?? "–"}</dd><dd className="text-[.72rem] text-[var(--muted)]">เวลาท้องถิ่น</dd></div>
              <div className="rounded-xl bg-[var(--paper)] px-2 py-2"><dt className="text-[.72rem] text-[var(--muted)]">บนเครื่อง</dt><dd className="text-[1.05rem] font-semibold tabular-nums">{flight.landingTime ? durationLabel(flightMinutes(flight.takeoffTime, flight.landingTime, key)) : "–"}</dd></div>
            </dl>
          : <p className="mt-3 text-[.9rem] text-[var(--muted)]">ยังไม่ได้ตั้งเวลา</p>}
      </li>)}</ol>
      <p className="mt-3 text-[.8rem] text-[var(--muted)]">เวลาเป็นเวลาท้องถิ่นของสนามบินแต่ละฝั่ง ไทยช้ากว่าญี่ปุ่น 2 ชั่วโมง</p>
      {person === OWNER && <Link href="/manage/flight" className="tap mt-3 inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 font-medium"><Settings size={18}/>ตั้งค่าเที่ยวบิน</Link>}
    </div>
    <BottomNav mapUrl={stay?.mapUrl ?? null} name={stay?.name} canManage={person === OWNER}/>
  </main>;
}
