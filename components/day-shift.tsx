"use client";
import { ArrowRight, Clock, X } from "lucide-react";
import { useState } from "react";
import type { DayData } from "@/lib/types";
import { shiftActivities } from "@/app/actions";
import { alertError, toastSuccess } from "@/lib/alerts";
import { dayLabel } from "@/lib/format";
import { shiftedTimes, toMinutes } from "@/lib/timeline";
import { useTokyoNow } from "@/lib/use-tokyo-now";
import { Field } from "./field";
import { reach } from "@/lib/reach";

const PRESETS = [-30, -15, 15, 30, 45, 60, 90];
const amountLabel = (minutes: number) => `${minutes > 0 ? "+" : "−"}${Math.abs(minutes)} นาที`;

// Running late: pick where the delay starts and how long it is, and every activity
// from there to the end of the day moves together. Negative minutes pull the day
// forward when the group is ahead of plan.
export function DayShift({ day, compact = false }: { day: DayData; compact?: boolean }) {
  const now = useTokyoNow();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [fromId, setFromId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [busy, setBusy] = useState(false);
  // In the timeline's order, which is by time and then the tie-break.
  const activities = [...day.activities].sort((a, b) => toMinutes(a.time) - toMinutes(b.time) || a.sortOrder - b.sortOrder);
  if (activities.length === 0) return null;

  const show = () => {
    // Today, the delay most likely starts at the next thing on the plan.
    const next = now?.date === day.date ? activities.find((a) => toMinutes(a.time) > now.minutes) : undefined;
    setFromId((next ?? activities[0]).id);
    setMinutes(30);
    setClosing(false);
    setOpen(true);
  };
  // Same exit as the activity sheet; the length matches sheet-out in globals.css.
  const close = () => { setClosing(true); window.setTimeout(() => { setOpen(false); setClosing(false); }, 160); };

  const shift = fromId && minutes ? shiftedTimes(activities, fromId, minutes) : null;
  const nameOf = (id: string) => activities.find((a) => a.id === id)?.name ?? "";

  const apply = async () => {
    if (!fromId || !shift?.ok) return;
    setBusy(true); const result = await reach(shiftActivities(day.id, fromId, minutes)); setBusy(false);
    if (!result.ok) { alertError(result.message); return; }
    toastSuccess(`เลื่อน ${shift.moved.length} กิจกรรมไป ${amountLabel(minutes)} แล้ว`);
    close();
  };

  return <>
    {compact
      ? <button type="button" onClick={show} className="tap inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--card)] px-3.5 text-[.88rem] font-medium"><Clock size={17}/>สายแล้ว เลื่อนเวลา</button>
      : <button type="button" onClick={show} className="tap -my-3 inline-flex items-center gap-1.5 rounded-xl px-3 text-[.9rem] font-medium text-[var(--muted)]"><Clock size={17}/>เลื่อนเวลา</button>}

    {open && <div className="overlay fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/55 p-4 sm:p-5" data-closing={closing} role="dialog" aria-modal="true" aria-labelledby="day-shift-title">
      <div className="sheet max-h-[92dvh] w-full max-w-lg overflow-auto rounded-[28px] bg-[var(--card)] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between">
          <h2 id="day-shift-title" className="text-2xl font-bold">เลื่อนเวลา</h2>
          <button onClick={close} className="tap grid place-items-center rounded-full" aria-label="ปิด"><X/></button>
        </div>
        <p className="mt-1 text-[.95rem] text-[var(--muted)]">{dayLabel(day.date)} · กิจกรรมตั้งแต่อันที่เลือกจนจบวันจะขยับตามกันทั้งหมด</p>

        <fieldset className="label mt-5">
          <legend className="mb-[5px]">เริ่มเลื่อนจาก</legend>
          <div className="grid gap-1.5">{activities.map((a) => <label key={a.id} className="cursor-pointer">
            <input type="radio" name="shiftFrom" value={a.id} checked={a.id === fromId} onChange={() => setFromId(a.id)} className="peer sr-only"/>
            <span className="flex min-h-[48px] min-w-0 items-center gap-3 rounded-xl border border-[var(--line)] px-3.5 transition-colors peer-checked:border-[var(--ink)] peer-checked:bg-[var(--ink)] peer-checked:text-[var(--on-dark)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent-ring)]">
              <span className="font-semibold tabular-nums">{a.time}</span>
              <span className="min-w-0 flex-1 truncate font-normal">{a.name}</span>
            </span>
          </label>)}</div>
        </fieldset>

        <fieldset className="label mt-4">
          <legend className="mb-[5px]">เลื่อนไป</legend>
          <div className="flex flex-wrap gap-2">{PRESETS.map((m) => <label key={m} className="cursor-pointer">
            <input type="radio" name="shiftBy" value={m} checked={m === minutes} onChange={() => setMinutes(m)} className="peer sr-only"/>
            <span className="flex min-h-[44px] items-center rounded-xl border border-[var(--line)] px-3.5 tabular-nums transition-colors peer-checked:border-[var(--ink)] peer-checked:bg-[var(--ink)] peer-checked:text-[var(--on-dark)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent-ring)]">{amountLabel(m)}</span>
          </label>)}</div>
          <label className="mt-2 flex items-center gap-3 text-[.9rem] text-[var(--muted)]">กำหนดเอง (นาที)
            <Field type="number" inputMode="numeric" step={5} min={-720} max={720} value={PRESETS.includes(minutes) ? "" : minutes} placeholder="เช่น 20 หรือ -10" onChange={(e) => setMinutes(e.target.value === "" ? 0 : Number(e.target.value))} className="min-h-[44px] py-1.5" wrapClassName="flex-1"/>
          </label>
        </fieldset>

        {/* The new times spelled out before anything changes, so the swap is never a guess. */}
        {shift && <div className="mt-5 rounded-2xl border border-[var(--line)] p-4">
          {shift.ok
            ? <>
                <p className="text-[.8rem] text-[var(--muted)]">หลังเลื่อน · {shift.moved.length} กิจกรรม</p>
                {/* min-w-0 on each row: a grid item will not shrink below its content
                    on its own, so a long name would push the row out of the box. */}
                <ul className="mt-2 grid gap-1.5">{shift.moved.map((m) => <li key={m.id} className="flex min-w-0 items-baseline gap-2 tabular-nums">
                  <span className="shrink-0 text-[var(--muted)] line-through decoration-[var(--line-strong)]">{m.from}</span>
                  <ArrowRight size={14} className="relative top-0.5 shrink-0 text-[var(--muted)]" aria-hidden/>
                  <span className="shrink-0 font-semibold">{m.to}</span>
                  <span className="min-w-0 flex-1 truncate">{nameOf(m.id)}</span>
                </li>)}</ul>
              </>
            : <p className="text-[.95rem] text-[var(--accent)]">{shift.message}</p>}
        </div>}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={close} className="tap rounded-xl border border-[var(--line)] font-medium">ยกเลิก</button>
          <button type="button" onClick={apply} disabled={!shift?.ok || busy} className="tap rounded-xl bg-[var(--ink)] font-medium text-[var(--on-dark)] disabled:opacity-40">{busy ? "กำลังเลื่อน…" : minutes ? `เลื่อน ${amountLabel(minutes)}` : "ใส่จำนวนนาทีก่อน"}</button>
        </div>
      </div>
    </div>}
  </>;
}
