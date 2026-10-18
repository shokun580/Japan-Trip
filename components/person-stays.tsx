"use client";
import { MapPin, Trash2 } from "lucide-react";
import { useState } from "react";
import type { PersonStayData } from "@/lib/types";
import { people, personName, personOf } from "@/lib/people";
import { deletePersonStay, savePersonStay } from "@/app/actions";
import { alertError, confirmAction, toastSuccess } from "@/lib/alerts";
import { AlertForm } from "./alert-form";

function StayFields({ stay, disabled }: { stay?: PersonStayData; disabled: boolean }) {
  return <>
    <label className="label">ชื่อที่พัก<input className="field" name="name" required defaultValue={stay?.name ?? ""} disabled={disabled}/></label>
    <label className="label">ลิงก์แผนที่
      <div className="relative">
        <MapPin className="pointer-events-none absolute top-3.5 left-3 text-[var(--muted)]" size={20}/>
        <input className="field field-icon" type="url" name="mapUrl" placeholder="https://maps.google.com/…" defaultValue={stay?.mapUrl ?? ""} disabled={disabled}/>
      </div>
    </label>
  </>;
}

export function PersonStays({ stays, readOnly }: { stays: PersonStayData[]; readOnly: boolean }) {
  const [removing, setRemoving] = useState<string | null>(null);
  const free = people.filter((p) => !stays.some((s) => s.person === p.key));

  async function remove(stay: PersonStayData) {
    if (!(await confirmAction(`ให้${personName(stay.person)}ใช้ที่พักหลัก?`, `${stay.name} จะถูกเอาออกจากคนนี้`, "เอาออก"))) return;
    setRemoving(stay.person);
    const result = await deletePersonStay(stay.person);
    setRemoving(null);
    if (result.ok) toastSuccess("กลับไปใช้ที่พักหลักแล้ว"); else alertError(result.message);
  }

  return <section className="mt-6">
    <h2 className="text-xl font-bold">ที่พักแยกรายคน</h2>
    <p className="mt-1 text-sm text-[var(--muted)]">คนที่อยู่ในรายการนี้จะเห็นที่พักของตัวเองแทนที่พักหลัก</p>

    <div className="mt-4 space-y-3">
      {stays.map((stay) => <AlertForm key={stay.person} action={savePersonStay} successText="บันทึกที่พักแล้ว" submitText="บันทึก" disabled={readOnly || removing === stay.person} className="card grid gap-4 p-5 sm:p-7">
        <input type="hidden" name="person" value={stay.person}/>
        <div className="flex items-center gap-3">
          <span className="person-badge person-badge-sm" data-tone={personOf(stay.person)?.tone} aria-hidden>{personOf(stay.person)?.short}</span>
          <p className="min-w-0 flex-1 truncate text-[1.05rem] font-medium">{personName(stay.person)}</p>
          <button type="button" onClick={() => void remove(stay)} disabled={readOnly || removing === stay.person} aria-label={`ให้${personName(stay.person)}ใช้ที่พักหลัก`} className="tap grid shrink-0 place-items-center rounded-xl text-[var(--muted)] disabled:opacity-40"><Trash2 size={20}/></button>
        </div>
        <StayFields stay={stay} disabled={readOnly}/>
      </AlertForm>)}

      {free.length > 0 && <AlertForm action={savePersonStay} successText="เพิ่มที่พักแยกแล้ว" submitText="เพิ่มที่พักแยก" disabled={readOnly} className="grid gap-4 rounded-[22px] border border-dashed border-[var(--line-strong)] p-5 sm:p-7">
        <label className="label">ใคร
          <select className="field" name="person" required defaultValue="" disabled={readOnly}>
            <option value="" disabled>เลือกคน</option>
            {free.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
          </select>
        </label>
        <StayFields disabled={readOnly}/>
      </AlertForm>}
    </div>
  </section>;
}
