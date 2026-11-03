import { getTrip } from "@/lib/data";
import { saveTripInfo } from "@/app/actions";
import { AlertForm } from "@/components/alert-form";
import { Field } from "@/components/field";

export const dynamic = "force-dynamic";

export default async function TripSettingsPage() {
  const trip = await getTrip();
  const readOnly = !process.env.DATABASE_URL;

  return <AlertForm action={saveTripInfo} successText="บันทึกข้อมูลทริปแล้ว" submitText="บันทึกข้อมูลทริป" disabled={readOnly} className="card grid gap-4 p-5 sm:p-7">
    <input type="hidden" name="id" value={trip.id}/>
    <h2 className="text-xl font-bold">ข้อมูลทริป</h2>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="label sm:col-span-2">ชื่อทริป<Field name="name" defaultValue={trip.name} required disabled={readOnly}/></label>
      <label className="label">วันเริ่มต้น<Field type="date" name="startDate" defaultValue={trip.startDate} required disabled={readOnly}/></label>
      <label className="label">วันสิ้นสุด<Field type="date" name="endDate" defaultValue={trip.endDate} required disabled={readOnly}/></label>
    </div>
  </AlertForm>;
}
