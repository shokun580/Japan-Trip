"use client";
import { ArrowLeftRight, Plane, Umbrella, X } from "lucide-react";
import { useState } from "react";
import type { DayData } from "@/lib/types";
import { driestSwap, skyFor, type Forecast, type ForecastByCity } from "@/lib/weather";
import { swapDays } from "@/app/actions";
import { alertError, toastSuccess } from "@/lib/alerts";
import { dayLabel } from "@/lib/format";
import { reach } from "@/lib/reach";
import { describe } from "./weather";

const countLabel = (day: DayData) => (day.activities.length ? `${day.activities.length} กิจกรรม` : "ว่าง");

function Rain({ forecast, size }: { forecast: Forecast; size: number }) {
  const { label, Icon } = describe(forecast.code);
  return <span className="inline-flex items-center gap-1" title={label}><Icon size={size} className="shrink-0" aria-hidden/>ฝน {forecast.rain}%</span>;
}

// The sky a plan lands on, against the rain it would have had where it was.
function SkyChange({ after, before }: { after: Forecast | undefined; before: Forecast | undefined }) {
  if (!after) return null;
  const change = !before ? "" : after.rain === before.rain ? " · เท่าเดิม" : ` · ${after.rain < before.rain ? "ลด" : "เพิ่ม"}จาก ${before.rain}%`;
  return <span className="mt-0.5 block text-[.82rem] text-[var(--muted)]"><Rain forecast={after} size={14}/>{change}</span>;
}

// Trades this day's whole plan with another day's: every activity and the title.
// `flightDates` are the days a flight leaves on; a flight stays on its date, so the
// sheet says so whenever one of the two days has one. `skies` lets it show what each
// plan's weather would become, and point at a drier day when this one looks wet.
export function DaySwap({ day, days, flightDates, skies, today }: { day: DayData; days: DayData[]; flightDates: string[]; skies: ForecastByCity; today: string }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const others = days.filter((d) => d.id !== day.id);
  const target = others.find((d) => d.id === targetId);
  const flightStays = target && [day.date, target.date].some((date) => flightDates.includes(date));
  const sky = (title: string, date: string) => skyFor(skies, title, date);
  const dodge = driestSwap(day, days, skies, today, flightDates);
  const dodgeCost = dodge && sky(dodge.title, day.date);

  const show = () => { setTargetId(null); setClosing(false); setOpen(true); };
  // Same exit as the activity sheet; the length matches sheet-out in globals.css.
  const close = () => { setClosing(true); window.setTimeout(() => { setOpen(false); setClosing(false); }, 160); };

  const swap = async () => {
    if (!target) return;
    setBusy(true); const result = await reach(swapDays(day.id, target.id)); setBusy(false);
    if (!result.ok) { alertError(result.message); return; }
    toastSuccess(`สลับ ${dayLabel(day.date)} กับ ${dayLabel(target.date)} แล้ว`);
    close();
  };

  return <>
    <button type="button" onClick={show} className="tap -my-3 inline-flex items-center gap-1.5 rounded-xl px-3 text-[.9rem] font-medium text-[var(--muted)]"><ArrowLeftRight size={17}/>สลับทั้งวัน</button>

    {open && <div className="overlay fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/55 p-4 sm:p-5" data-closing={closing} role="dialog" aria-modal="true" aria-labelledby="day-swap-title">
      <div className="sheet max-h-[92dvh] w-full max-w-lg overflow-auto rounded-[28px] bg-[var(--card)] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between">
          <h2 id="day-swap-title" className="text-2xl font-bold">สลับทั้งวัน</h2>
          <button onClick={close} className="tap grid place-items-center rounded-full" aria-label="ปิด"><X/></button>
        </div>
        <p className="mt-1 text-[.95rem] text-[var(--muted)]">กิจกรรมทั้งหมดและชื่อวันของ {dayLabel(day.date)} จะแลกกับวันที่เลือก</p>

        {/* Only ever a suggestion: it picks the day, the swap is still a separate press.
            Gone once a day is picked, when the outcome below says the same and the sheet
            needs the room to keep its buttons on a phone's screen. */}
        {dodge && !target && <button type="button" onClick={() => setTargetId(dodge.id)} className="mt-4 flex w-full items-start gap-3 rounded-2xl bg-[var(--accent-wash)] p-4 text-left">
          <Umbrella size={20} className="mt-0.5 shrink-0 text-[var(--accent)]" aria-hidden/>
          <span className="min-w-0 flex-1">
            <span className="block">{day.title} วันที่ {dayLabel(day.date)} ฝน {sky(day.title, day.date)?.rain}%</span>
            <span className="block">สลับกับ {dayLabel(dodge.date)} ฝนเหลือ {sky(day.title, dodge.date)?.rain}% ดีไหม</span>
            {dodgeCost && <span className="mt-1 block text-[.85rem] text-[var(--muted)]">แผน {dodge.title} จะมาเจอฝน {dodgeCost.rain}% แทน</span>}
            <span className="mt-1 block text-[.85rem] text-[var(--accent)]">แตะเพื่อเลือก {dayLabel(dodge.date)}</span>
          </span>
        </button>}

        <fieldset className="label mt-5">
          <legend className="mb-[5px]">สลับกับวัน</legend>
          <div className="grid grid-cols-4 gap-2">{others.map((d) => { const f = sky(day.title, d.date); return <label key={d.id} className="min-w-0 cursor-pointer">
            <input type="radio" name="swapDay" value={d.id} checked={d.id === targetId} onChange={() => setTargetId(d.id)} className="peer sr-only"/>
            <span className={`flex min-h-[64px] flex-col items-center justify-center rounded-xl border px-1 py-1.5 text-center transition-colors peer-checked:border-[var(--ink)] peer-checked:bg-[var(--ink)] peer-checked:text-[var(--on-dark)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent-ring)] ${d.id === dodge?.id ? "border-[var(--accent)]" : "border-[var(--line)]"}`}>
              <span className="text-[.88rem] font-medium tabular-nums">{dayLabel(d.date)}</span>
              <span className="w-full truncate text-[.72rem] font-normal opacity-70">{d.title}</span>
              <span className="w-full truncate text-[.72rem] font-normal opacity-70">{countLabel(d)}</span>
              {f && <span className="mt-0.5 text-[.72rem] font-normal tabular-nums"><Rain forecast={f} size={12}/></span>}
            </span>
          </label>; })}</div>
        </fieldset>

        {/* The outcome spelled out, so the swap is never a guess. */}
        {target && <div className="mt-5 rounded-2xl border border-[var(--line)] p-4">
          <p className="text-[.8rem] text-[var(--muted)]">หลังสลับ</p>
          <ul className="mt-2 grid gap-2">{[{ on: day, gets: target }, { on: target, gets: day }].map(({ on, gets }) => <li key={on.id} className="flex min-w-0 items-baseline gap-3">
            <span className="w-16 shrink-0 font-semibold tabular-nums">{dayLabel(on.date)}</span>
            <span className="min-w-0 flex-1"><span className="block truncate">{gets.title}<span className="text-[var(--muted)]"> · {countLabel(gets)}</span></span><SkyChange after={sky(gets.title, on.date)} before={sky(gets.title, gets.date)}/></span>
          </li>)}</ul>
          {flightStays && <p className="mt-3 flex items-center gap-2 border-t border-[var(--line)] pt-3 text-sm text-[var(--muted)]"><Plane size={16} className="shrink-0"/>เที่ยวบินไม่ย้ายตาม ยังอยู่วันเดิม</p>}
        </div>}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={close} className="tap rounded-xl border border-[var(--line)] font-medium">ยกเลิก</button>
          <button type="button" onClick={swap} disabled={!target || busy} className="tap rounded-xl bg-[var(--ink)] font-medium text-[var(--on-dark)] disabled:opacity-40">{busy ? "กำลังสลับ…" : target ? `สลับกับ ${dayLabel(target.date)}` : "เลือกวันก่อน"}</button>
        </div>
      </div>
    </div>}
  </>;
}
