import { PlaneLanding, PlaneTakeoff } from "lucide-react";
import { getTrip } from "@/lib/data";
import { saveFlights } from "@/app/actions";
import { AlertForm } from "@/components/alert-form";

export const dynamic = "force-dynamic";

export default async function FlightSettingsPage() {
  const trip = await getTrip();
  const readOnly = !process.env.DATABASE_URL;

  return <AlertForm action={saveFlights} successText="บันทึกเที่ยวบินแล้ว" submitText="บันทึกเที่ยวบิน" disabled={readOnly} className="card grid gap-3 p-4 sm:gap-4 sm:p-7">
    <input type="hidden" name="id" value={trip.id}/>
    <div>
      <h2 className="text-xl font-bold">เที่ยวบิน</h2>
      <p className="mt-0.5 text-sm text-[var(--muted)]">ใช้เวลาท้องถิ่นของแต่ละสนามบิน</p>
    </div>
    <section className="grid gap-2.5">
      <h3 className="flex items-center gap-2 font-semibold"><PlaneTakeoff size={19} className="text-[var(--muted)]"/>ขาไป</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="label col-span-2 sm:col-span-1">วันออกเดินทาง<input className="field" type="date" name="takeoffDate" defaultValue={trip.outbound.date ?? ""} disabled={readOnly}/></label>
        <label className="label">เวลาออก<input className="field" type="time" name="takeoffTime" defaultValue={trip.outbound.takeoffTime ?? ""} disabled={readOnly}/></label>
        <label className="label">เวลาถึงญี่ปุ่น<input className="field" type="time" name="landingTime" defaultValue={trip.outbound.landingTime ?? ""} disabled={readOnly}/></label>
      </div>
    </section>
    <section className="grid gap-2.5 border-t border-[var(--line)] pt-3">
      <h3 className="flex items-center gap-2 font-semibold"><PlaneLanding size={19} className="text-[var(--muted)]"/>ขากลับ</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="label col-span-2 sm:col-span-1">วันออกเดินทาง<input className="field" type="date" name="returnDate" defaultValue={trip.inbound.date ?? ""} disabled={readOnly}/></label>
        <label className="label">เวลาออก<input className="field" type="time" name="returnTime" defaultValue={trip.inbound.takeoffTime ?? ""} disabled={readOnly}/></label>
        <label className="label">เวลาถึงไทย<input className="field" type="time" name="returnLandingTime" defaultValue={trip.inbound.landingTime ?? ""} disabled={readOnly}/></label>
      </div>
    </section>
  </AlertForm>;
}
