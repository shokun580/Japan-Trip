"use client";
import { ArrowUpDown, Check, CloudSun, GripHorizontal, ListChecks, PlaneTakeoff, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { saveHomeOrder } from "@/app/settings/actions";
import { alertError } from "@/lib/alerts";
import { DEFAULT_ORDER, HOME_SECTIONS, type HomeSection } from "@/lib/home-layout";
import { useDragSwap } from "@/lib/use-drag-swap";
import { reach } from "@/lib/reach";

const labelOf = (key: HomeSection) => HOME_SECTIONS.find((s) => s.key === key)!.label;

// A small likeness of each home-page section, so arranging them feels like
// arranging the home page itself rather than a list of names.
function Widget({ section }: { section: HomeSection }) {
  switch (section) {
    case "next": return <div className="hero widget-face">
      <p className="eyebrow">ถัดไป</p>
      <div className="mt-1 flex items-center justify-between"><span className="text-[1.3rem] leading-none font-bold text-[var(--accent)] tabular-nums">02:55</span><span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[.65rem] font-semibold text-[var(--snow)]">อีก 10 นาที</span></div>
      <p className="mt-1 text-[.85rem] font-semibold">กิจกรรมถัดไป</p>
    </div>;
    case "flights": return <div className="flight-card widget-face">
      <p className="flight-card-title">เที่ยวบิน</p>
      <div className="mt-1.5 flex items-center gap-2"><span className="flight-icon !h-7 !w-7"><PlaneTakeoff size={15}/></span><span className="text-[.85rem] font-semibold">ขาไป · 10:40 น.</span></div>
    </div>;
    case "weather": return <div className="card widget-face">
      <p className="eyebrow">อากาศ</p>
      <div className="mt-1.5 flex gap-1.5">{[15, 15, 17, 18].map((t, i) => <span key={i} className={`flex flex-1 flex-col items-center rounded-lg border py-1 text-[.68rem] tabular-nums ${i === 0 ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--on-dark)]" : "border-[var(--line)]"}`}><CloudSun size={13}/>{t}°</span>)}</div>
    </div>;
    case "money": return <div className="card widget-face">
      <p className="eyebrow">เงิน</p>
      <div className="mt-1 grid gap-0.5 text-[.85rem] font-semibold tabular-nums"><span className="flex justify-between">🇯🇵 JPY<span>1,000</span></span><span className="flex justify-between">🇹🇭 THB<span>฿213</span></span></div>
    </div>;
    case "checklist": return <div className="card widget-face">
      <div className="flex items-center gap-2"><ListChecks size={16}/><p className="eyebrow">เช็คลิสต์</p></div>
      <span className="meter mt-2"><span style={{ width: "40%" }}/></span>
    </div>;
  }
}

// Each person's own order for the home page's sections, arranged the way the home
// page looks: press and hold a widget, then drop it on another to swap the two
// (arrow keys too). A swap shows at once and is saved straight away; a failed save
// puts the order back.
export function HomeLayoutEditor({ initial, live }: { initial: HomeSection[]; live: boolean }) {
  const [order, setOrder] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const saved = useRef(initial);

  const save = async (next: HomeSection[]) => {
    const before = saved.current;
    setOrder(next);
    if (!live) return;
    setState("saving");
    const result = await reach(saveHomeOrder(next));
    if (!result.ok) { setOrder(before); setState("idle"); alertError(result.message); return; }
    saved.current = next;
    setState("saved");
  };

  const swap = (from: string, to: string) => {
    const i = order.indexOf(from as HomeSection), j = order.indexOf(to as HomeSection);
    if (i < 0 || j < 0) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    void save(next);
  };
  const { list, lifted, over, row, keys } = useDragSwap(order.join(), swap);
  const isDefault = order.every((key, i) => key === DEFAULT_ORDER[i]);

  return <>
    <div className="mt-5 flex min-h-6 items-center justify-between gap-3 px-1">
      <p className="flex items-center gap-1.5 text-[.85rem] text-[var(--muted)]"><ArrowUpDown size={15}/>กดค้างที่ widget แล้วลากไปวางบนอีกอันเพื่อสลับที่</p>
      {state === "saving" && <span className="shrink-0 text-[.8rem] text-[var(--muted)]">กำลังบันทึก…</span>}
      {state === "saved" && <span className="inline-flex shrink-0 items-center gap-1 text-[.8rem] text-[var(--muted)]"><Check size={14}/>บันทึกแล้ว</span>}
    </div>
    <ul ref={list} className="widget-board mt-3 space-y-2.5">{order.map((key) => <li key={key} {...row(key)} className="swap-row widget-row" data-lifted={key === lifted} data-over={key === over}>
      <Widget section={key}/>
      <button type="button" {...keys(key)} className="widget-grip" aria-label={`${labelOf(key)} กดค้างแล้วลาก หรือกดลูกศรขึ้นลง เพื่อสลับที่`}><GripHorizontal size={18}/></button>
    </li>)}</ul>
    {!isDefault && <button type="button" onClick={() => void save(DEFAULT_ORDER)} className="tap mt-3 inline-flex items-center gap-2 rounded-xl px-2 text-[.9rem] font-medium text-[var(--muted)]"><RotateCcw size={17}/>คืนค่าเริ่มต้น</button>}
    {!live && <p className="mt-4 rounded-2xl border border-dashed border-[var(--line-strong)] p-3 text-[.85rem] text-[var(--muted)]">โหมดตัวอย่าง: ยังไม่ได้ต่อฐานข้อมูล ลำดับที่เปลี่ยนจะไม่ถูกบันทึก</p>}
  </>;
}
