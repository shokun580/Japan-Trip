"use client";
import Link from "next/link";
import { ArrowUpDown, GripHorizontal, Lock, Pencil, PlaneLanding, PlaneTakeoff, Plus, Trash2, X } from "lucide-react";
import { startTransition, useOptimistic, useState } from "react";
import type { ActionResult, ActivityData, DayData } from "@/lib/types";
import { deleteActivity, saveActivity, swapActivities } from "@/app/actions";
import { alertError, confirmDelete, toastSuccess } from "@/lib/alerts";
import { durationLabel, swapEntries, type TimelineEntry } from "@/lib/timeline";
import { dayLabel } from "@/lib/format";
import { useDragSwap } from "@/lib/use-drag-swap";
import { Field, TextArea } from "./field";

export function ActivityEditor({ day, days, entries }: { day: DayData; days: DayData[]; entries: TimelineEntry[] }) {
  const [editing, setEditing] = useState<ActivityData | "new" | null>(null);
  // Every open starts on the day being viewed; picking another day is what moves it.
  const [dayId, setDayId] = useState(day.id);
  const [busy, setBusy] = useState(false);
  // Closing plays the sheet's exit before it unmounts; the length matches sheet-out
  // in globals.css.
  const [closing, setClosing] = useState(false);
  const open = (target: ActivityData | "new") => { setEditing(target); setDayId(day.id); setClosing(false); };
  const close = () => { setClosing(true); window.setTimeout(() => { setEditing(null); setClosing(false); }, 160); };
  const target = days.find((d) => d.id === dayId) ?? day;
  const moving = target.id !== day.id;

  const report = (result: ActionResult, success: string) => { if (result.ok) toastSuccess(success); else alertError(result.message); return result.ok; };

  const remove = async (activity: ActivityData) => {
    if (!(await confirmDelete(activity.name))) return;
    setBusy(true); const result = await deleteActivity(activity.id); setBusy(false);
    report(result, "ลบกิจกรรมแล้ว");
  };

  // A swap shows at once; the server's answer replaces it, or puts it back on failure.
  const [shown, swapShown] = useOptimistic(entries, (current, [from, to]: [string, string]) => swapEntries(current, from, to));
  const swap = (from: string, to: string) => startTransition(async () => {
    swapShown([from, to]);
    report(await swapActivities(from, to), "สลับเวลาแล้ว");
  });
  const { list, lifted, over, row, keys } = useDragSwap(shown.map((e) => `${e.id}@${e.time}`).join(), swap);
  const activities = shown.flatMap((e) => (e.kind === "activity" ? [e.activity] : []));
  const canSwap = activities.length > 1;
  const timeOf = (id: string | null) => activities.find((a) => a.id === id)?.time;

  return <div>
    <button onClick={() => open("new")} className="tap mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--ink)] px-4 py-2 font-medium text-[var(--on-dark)]"><Plus size={20}/>เพิ่มกิจกรรม</button>

    {entries.length === 0 && <p className="mt-4 text-[var(--muted)]">ยังไม่มีกิจกรรมสำหรับวันนี้</p>}
    {canSwap && <p className="mt-4 flex items-center gap-2 text-sm text-[var(--muted)]"><ArrowUpDown size={16} className="shrink-0"/>กดค้างแล้วลากไปวาง เพื่อสลับเวลา</p>}
    <ul ref={list} className="mt-4 space-y-3">{shown.map((entry) => {
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
      // While a card hovers over another, each shows the time it is about to get.
      const preview = activity.id === lifted ? timeOf(over) : activity.id === over ? timeOf(lifted) : undefined;
      return <li key={entry.id} {...(canSwap ? row(activity.id) : {})} className="swap-row rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4" data-lifted={activity.id === lifted} data-over={activity.id === over}>
        <div className="flex gap-3">
          {canSwap
            ? <button type="button" {...keys(activity.id)} className="swap-key -my-2 -ml-2 flex w-[4.25rem] shrink-0 flex-col items-center self-start rounded-lg py-2" aria-label={`${activity.time} ${activity.name} กดค้างแล้วลาก หรือกดลูกศรขึ้นลง เพื่อสลับเวลา`}>
                <time className="font-semibold tabular-nums" data-preview={Boolean(preview)}>{preview ?? activity.time}</time>
                <GripHorizontal size={16} className="text-[var(--muted)]" aria-hidden/>
              </button>
            : <time className="font-semibold tabular-nums">{activity.time}</time>}
          <div className="min-w-0 flex-1"><p className="font-medium">{activity.name}</p>{activity.description && <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{activity.description}</p>}</div>
          {/* Pulled into the card's padding so the 48px touch targets cost no extra height. */}
          <div className="-mt-2 -mr-2 flex shrink-0 items-start">
            <button onClick={() => open(activity)} className="tap grid place-items-center rounded-lg" aria-label={`แก้ไขหรือย้าย ${activity.name}`}><Pencil size={19}/></button>
            <button onClick={() => remove(activity)} disabled={busy} className="tap grid place-items-center rounded-lg text-[var(--accent)] disabled:opacity-40" aria-label={`ลบ ${activity.name}`}><Trash2 size={19}/></button>
          </div>
        </div>
      </li>;
    })}</ul>

    {editing && <div className="overlay fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/55 p-4 sm:p-5" data-closing={closing} role="dialog" aria-modal="true" aria-labelledby="activity-title">
      <div className="sheet max-h-[92dvh] w-full max-w-lg overflow-auto rounded-[28px] bg-[var(--card)] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between">
          <h2 id="activity-title" className="text-2xl font-bold">{editing === "new" ? "เพิ่มกิจกรรม" : "แก้ไขกิจกรรม"}</h2>
          <button onClick={close} className="tap grid place-items-center rounded-full" aria-label="ปิด"><X/></button>
        </div>
        <form action={async (formData) => {
          setBusy(true); const result = await saveActivity(formData); setBusy(false);
          const where = dayLabel(target.date);
          const success = editing === "new" ? (moving ? `เพิ่มกิจกรรมใน ${where} แล้ว` : "เพิ่มกิจกรรมแล้ว") : (moving ? `ย้ายไป ${where} แล้ว` : "บันทึกกิจกรรมแล้ว");
          if (report(result, success)) close();
        }} className="mt-5 grid gap-4">
          {editing !== "new" && <input type="hidden" name="activityId" value={editing.id}/>}
          {/* Radios styled as chips rather than a <select>: the native picker sits off-centre
              on phones, and every day stays one tap away. */}
          <fieldset className="label">
            <legend className="mb-[5px]">วัน</legend>
            <div className="grid grid-cols-4 gap-2">{days.map((d) => <label key={d.id} className="min-w-0 cursor-pointer">
              <input type="radio" name="tripDayId" value={d.id} checked={d.id === dayId} onChange={() => setDayId(d.id)} className="peer sr-only"/>
              <span className="flex min-h-[52px] flex-col items-center justify-center rounded-xl border border-[var(--line)] px-1 py-1.5 text-center transition-colors peer-checked:border-[var(--ink)] peer-checked:bg-[var(--ink)] peer-checked:text-[var(--on-dark)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent-ring)]">
                <span className="text-[.88rem] font-medium tabular-nums">{dayLabel(d.date)}</span>
                <span className="w-full truncate text-[.72rem] font-normal opacity-70">{d.id === day.id ? "วันเดิม" : d.title}</span>
              </span>
            </label>)}</div>
          </fieldset>
          <label className="label">เวลา<Field type="time" name="time" defaultValue={editing === "new" ? "09:00" : editing.time} required/></label>
          <label className="label">ชื่อ<Field name="name" defaultValue={editing === "new" ? "" : editing.name} maxLength={120} required/></label>
          <label className="label">รายละเอียด<TextArea className="min-h-28 resize-y" name="description" defaultValue={editing === "new" ? "" : editing.description ?? ""} maxLength={1000}/></label>
          <label className="label">ลิงก์แผนที่<Field type="url" name="mapUrl" placeholder="https://maps.google.com/…" defaultValue={editing === "new" ? "" : editing.mapUrl ?? ""}/></label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button type="button" onClick={close} className="tap rounded-xl border border-[var(--line)] font-medium">ยกเลิก</button>
            <button disabled={busy} className="tap rounded-xl bg-[var(--ink)] font-medium text-[var(--on-dark)] disabled:opacity-40">{busy ? "กำลังบันทึก…" : editing !== "new" && moving ? `ย้ายไป ${dayLabel(target.date)}` : "บันทึก"}</button>
          </div>
        </form>
      </div>
    </div>}
  </div>;
}
