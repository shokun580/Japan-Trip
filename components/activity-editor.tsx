"use client";
import Link from "next/link";
import { Lock, Pencil, PlaneLanding, PlaneTakeoff, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { ActionResult, ActivityData, DayData } from "@/lib/types";
import { deleteActivity, saveActivity } from "@/app/actions";
import { alertError, confirmDelete, toastSuccess } from "@/lib/alerts";
import { durationLabel, type TimelineEntry } from "@/lib/timeline";

export function ActivityEditor({ day, entries }: { day: DayData; entries: TimelineEntry[] }) {
  const [editing, setEditing] = useState<ActivityData | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  const report = (result: ActionResult, success: string) => { if (result.ok) toastSuccess(success); else alertError(result.message); return result.ok; };

  const remove = async (activity: ActivityData) => {
    if (!(await confirmDelete(activity.name))) return;
    setBusy(true); const result = await deleteActivity(activity.id); setBusy(false);
    report(result, "ลบกิจกรรมแล้ว");
  };

  return <div>
    <button onClick={() => setEditing("new")} className="tap mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--ink)] px-4 py-2 font-medium text-[var(--on-dark)]"><Plus size={20}/>เพิ่มกิจกรรม</button>

    {entries.length === 0 && <p className="mt-4 text-[var(--muted)]">ยังไม่มีกิจกรรมสำหรับวันนี้</p>}
    <ul className="mt-4 space-y-3">{entries.map((entry) => {
      // Same dark treatment as the timeline, so a flight reads as a flight everywhere.
      if (entry.kind === "flight") return <li key={entry.id} className="flight-leg">
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[.72rem] tracking-[.14em] text-[var(--on-dark-soft)] uppercase"><PlaneTakeoff size={16}/>{entry.label}</p>
            <p className="mt-1.5 flex items-center gap-2 text-[1.12rem] font-semibold tabular-nums">{entry.time}{entry.landingTime && <><span className="text-[var(--on-dark-faint)]">→</span>{entry.landingTime}<PlaneLanding size={16} className="text-[var(--on-dark-soft)]"/></>}<span className="text-[.9rem] font-normal text-[var(--on-dark-soft)]">น.</span></p>
          </div>
          {entry.minutes !== null
            ? <span className="flight-pill">อยู่บนเครื่อง {durationLabel(entry.minutes)}</span>
            : <span className="text-[.8rem] text-[var(--on-dark-soft)]">ยังไม่ได้ระบุเวลาถึง</span>}
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-[var(--on-dark-line)] pt-3 text-sm text-[var(--on-dark-soft)]">
          <Lock size={16}/>แก้เวลาได้ที่
          <Link href="/manage/flight" className="font-medium text-[var(--on-dark)] underline">ตั้งค่าเที่ยวบิน</Link>
        </div>
      </li>;

      const { activity } = entry;
      return <li key={entry.id} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
        <div className="flex gap-3">
          <time className="font-semibold tabular-nums">{activity.time}</time>
          <div className="min-w-0 flex-1"><p className="font-medium">{activity.name}</p>{activity.description && <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{activity.description}</p>}</div>
          {/* Pulled into the card's padding so the 48px touch targets cost no extra height. */}
          <div className="-mt-2 -mr-2 flex shrink-0 items-start">
            <button onClick={() => setEditing(activity)} className="tap grid place-items-center rounded-lg" aria-label={`แก้ไข ${activity.name}`}><Pencil size={19}/></button>
            <button onClick={() => remove(activity)} disabled={busy} className="tap grid place-items-center rounded-lg text-[var(--accent)] disabled:opacity-40" aria-label={`ลบ ${activity.name}`}><Trash2 size={19}/></button>
          </div>
        </div>
      </li>;
    })}</ul>

    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/55 p-4 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="activity-title">
      <div className="max-h-[92dvh] w-full max-w-lg overflow-auto rounded-[28px] bg-[var(--card)] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between">
          <h2 id="activity-title" className="text-2xl font-bold">{editing === "new" ? "เพิ่มกิจกรรม" : "แก้ไขกิจกรรม"}</h2>
          <button onClick={() => setEditing(null)} className="tap grid place-items-center rounded-full" aria-label="ปิด"><X/></button>
        </div>
        <form action={async (formData) => {
          setBusy(true); const result = await saveActivity(formData); setBusy(false);
          if (report(result, editing === "new" ? "เพิ่มกิจกรรมแล้ว" : "บันทึกกิจกรรมแล้ว")) setEditing(null);
        }} className="mt-5 grid gap-4">
          <input type="hidden" name="tripDayId" value={day.id}/>
          {editing !== "new" && <input type="hidden" name="activityId" value={editing.id}/>}
          <label className="label">เวลา<input className="field" type="time" name="time" defaultValue={editing === "new" ? "09:00" : editing.time} required/></label>
          <label className="label">ชื่อ<input className="field" name="name" defaultValue={editing === "new" ? "" : editing.name} maxLength={120} required/></label>
          <label className="label">รายละเอียด<textarea className="field min-h-28 resize-y" name="description" defaultValue={editing === "new" ? "" : editing.description ?? ""} maxLength={1000}/></label>
          <label className="label">ลิงก์แผนที่<input className="field" type="url" name="mapUrl" placeholder="https://maps.google.com/…" defaultValue={editing === "new" ? "" : editing.mapUrl ?? ""}/></label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setEditing(null)} className="tap rounded-xl border border-[var(--line)] font-medium">ยกเลิก</button>
            <button disabled={busy} className="tap rounded-xl bg-[var(--ink)] font-medium text-[var(--on-dark)] disabled:opacity-40">{busy ? "กำลังบันทึก…" : "บันทึก"}</button>
          </div>
        </form>
      </div>
    </div>}
  </div>;
}
