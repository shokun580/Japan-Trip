import Link from "next/link";
import { getTrip } from "@/lib/data";
import { dayLabel } from "@/lib/format";
import { ActivityEditor } from "@/components/activity-editor";
import { dayEntries } from "@/lib/timeline";
import { DayTitleField } from "@/components/day-title-field";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const trip = await getTrip();
  const params = await searchParams;
  const selected = trip.days.find((d) => d.id === params.day) ?? trip.days[0];
  const readOnly = !process.env.DATABASE_URL;

  return <section>
    <h2 className="text-xl font-bold">กิจกรรม</h2>
    <p className="mt-1 text-sm text-[var(--ink)]">เลือกวัน ตั้งชื่อวัน แล้วเพิ่มหรือแก้ไขกิจกรรมของวันนั้น</p>
    <div className="slider mt-4 flex gap-2" aria-label="เลือกวัน">
      {trip.days.map((d) => <Link key={d.id} href={`/manage/activities?day=${d.id}`} className={`tap flex shrink-0 items-center rounded-xl border px-4 font-medium ${selected?.id === d.id ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--on-dark)]" : "border-[var(--line)] bg-[var(--card)]"}`}>{dayLabel(d.date)}</Link>)}
    </div>
    {selected && <div className="card mt-4 p-5 sm:p-7">
      <p className="eyebrow">{dayLabel(selected.date)}</p>
      {readOnly
        ? <>
            <h3 className="mt-1 text-xl font-semibold">{selected.title}</h3>
            <p className="mt-4 text-[var(--muted)]">เชื่อมต่อฐานข้อมูลเพื่อเพิ่ม แก้ไข หรือลบกิจกรรม</p>
          </>
        : <>
            <div className="mt-2 border-b border-[var(--line)] pb-5">
              <DayTitleField key={selected.id} dayId={selected.id} title={selected.title}/>
            </div>
            <ActivityEditor day={selected} entries={dayEntries(trip, selected)}/>
          </>}
    </div>}
  </section>;
}
