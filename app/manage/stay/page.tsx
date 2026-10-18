import { MapPin } from "lucide-react";
import { getPersonStays, getTrip } from "@/lib/data";
import { saveAccommodation } from "@/app/actions";
import { AlertForm } from "@/components/alert-form";
import { PersonStays } from "@/components/person-stays";

export const dynamic = "force-dynamic";

export default async function StaySettingsPage() {
  const [trip, stays] = await Promise.all([getTrip(), getPersonStays()]);
  const readOnly = !process.env.DATABASE_URL;

  return <>
    <AlertForm action={saveAccommodation} successText="บันทึกที่พักแล้ว" submitText="บันทึกที่พัก" disabled={readOnly} className="card grid gap-4 p-5 sm:p-7">
      <input type="hidden" name="id" value={trip.id}/>
      <div>
        <h2 className="text-xl font-bold">ที่พักหลัก</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">ที่พักของทุกคน ยกเว้นคนที่มีที่พักแยกด้านล่าง ใส่ลิงก์แผนที่แล้วปุ่มที่พักในเมนูด้านล่างจะกดเปิดได้ทันที</p>
      </div>
      <label className="label">ชื่อที่พัก<input className="field" name="accommodationName" defaultValue={trip.accommodation?.name ?? ""} disabled={readOnly}/></label>
      <label className="label">ลิงก์แผนที่
        <div className="relative">
          <MapPin className="pointer-events-none absolute top-3.5 left-3 text-[var(--muted)]" size={20}/>
          <input className="field field-icon" type="url" name="mapUrl" placeholder="https://maps.google.com/…" defaultValue={trip.accommodation?.mapUrl ?? ""} disabled={readOnly}/>
        </div>
      </label>
    </AlertForm>
    <PersonStays stays={stays} readOnly={readOnly}/>
  </>;
}
