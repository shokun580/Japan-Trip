"use client";
import Link from "next/link";
import { ChevronLeft, Plus, RotateCw, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { Field } from "./field";
import { DecideTabs } from "./decide-tabs";
import { BottomNav } from "./bottom-nav";
import type { NavData } from "@/lib/nav";

// Spin to settle what nobody will decide. The wheel starts empty every time and
// keeps nothing anywhere; a poll can hand its options over through the page's ?o=.
const MAX = 12;
const TURNS = 6;
const SPIN_MS = 4200;

// Sectors cycle through the palette so neighbours never share a colour.
const FILLS = ["var(--ink)", "var(--sky)", "var(--accent)", "var(--slate)", "color-mix(in srgb, var(--sky) 55%, var(--card))", "color-mix(in srgb, var(--accent) 55%, var(--card))"];
const INKS = ["var(--on-dark)", "var(--ink)", "var(--snow)", "var(--on-dark)", "var(--ink)", "var(--ink)"];

function sectorPath(i: number, n: number) {
  const a0 = (i / n) * 2 * Math.PI, a1 = ((i + 1) / n) * 2 * Math.PI;
  const x0 = 50 + 50 * Math.sin(a0), y0 = 50 - 50 * Math.cos(a0), x1 = 50 + 50 * Math.sin(a1), y1 = 50 - 50 * Math.cos(a1);
  return `M50 50 L${x0} ${y0} A50 50 0 ${n === 1 ? 1 : 0} 1 ${x1} ${y1} Z`;
}

export function DecisionWheel({ initial, nav }: { initial: string[] | null; nav: NavData }) {
  const [items, setItems] = useState<string[]>(() => initial ?? []);
  const [draft, setDraft] = useState("");
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const wheel = useRef<SVGSVGElement>(null);


  const add = () => {
    const name = draft.trim();
    if (!name || items.length >= MAX) return;
    setItems((prev) => [...prev, name]); setDraft(""); setWinner(null);
  };
  const remove = (index: number) => { setItems((prev) => prev.filter((_, i) => i !== index)); setWinner(null); };

  const spin = () => {
    if (spinning || items.length < 2) return;
    const n = items.length;
    const pick = Math.floor(Math.random() * n);
    // Land somewhere inside the picked sector, never on a boundary, with the pointer
    // fixed at the top: the wheel turns so that sector's centre comes under it.
    const within = (Math.random() * 0.7 + 0.15) * (360 / n);
    const target = 360 * TURNS + (360 - ((pick * 360) / n + within));
    const from = angle % 360;
    setSpinning(true); setWinner(null);
    const animation = wheel.current?.animate([{ transform: `rotate(${from}deg)` }, { transform: `rotate(${from + target}deg)` }], { duration: SPIN_MS, easing: "cubic-bezier(.12,.8,.18,1)", fill: "forwards" });
    const done = () => { setAngle(from + target); setSpinning(false); setWinner(items[pick]); navigator.vibrate?.([20, 40, 20]); };
    if (animation) animation.onfinish = done; else done();
  };

  const n = items.length;
  return <main className="shell">
    <header className="flex items-center justify-between gap-3">
      <Link href="/" className="tap -ml-2 flex items-center gap-1 rounded-xl px-2 font-medium text-[var(--ink)]"><ChevronLeft size={22} />กลับ</Link>
    </header>
    <div className="mt-5">
      <p className="eyebrow">ตัดสินใจไม่ได้</p>
      <h1 className="text-[1.45rem] leading-tight font-bold tracking-tight">วงล้อตัดสินใจ</h1>
      <p className="mt-1 text-[.92rem] text-[var(--muted)]">ใส่ตัวเลือก แล้วให้วงล้อเลือกให้</p>
    </div>
    <DecideTabs/>

    <section className="relative mx-auto mt-6 w-[min(100%,340px)]" aria-label="วงล้อ">
      <span className="wheel-pointer" aria-hidden/>
      <svg ref={wheel} viewBox="0 0 100 100" className="wheel" style={{ transform: `rotate(${angle}deg)` }} role="img" aria-label={`วงล้อ ${n} ช่อง`}>
        {/* An empty wheel is a dashed ring until the first choice goes in. */}
        {n === 0 && <circle cx="50" cy="50" r="49" fill="var(--card)" stroke="var(--line-strong)" strokeWidth=".6" strokeDasharray="2 2"/>}
        {items.map((label, i) => {
          const mid = ((i + 0.5) / n) * 360;
          return <g key={`${label}-${i}`}>
            <path d={sectorPath(i, n)} fill={FILLS[i % FILLS.length]} stroke="var(--card)" strokeWidth=".6"/>
            <text x="50" y="50" transform={`rotate(${mid} 50 50) translate(0 -31)`} textAnchor="middle" dominantBaseline="middle" fill={INKS[i % INKS.length]} fontSize={n > 8 ? 3.6 : 4.4} fontWeight="600">{label.length > 14 ? `${label.slice(0, 13)}…` : label}</text>
          </g>;
        })}
        <circle cx="50" cy="50" r="7" fill="var(--card)" stroke="var(--line-strong)" strokeWidth=".6"/>
      </svg>
      <button type="button" onClick={spin} disabled={spinning || n < 2} className="wheel-spin tap" aria-label="หมุนวงล้อ"><RotateCw size={22} className={spinning ? "animate-spin" : ""}/></button>
    </section>

    <div className="mt-5 min-h-[76px] text-center" aria-live="polite">
      {winner
        ? <div className="card inline-block px-6 py-3"><p className="text-[.78rem] text-[var(--muted)]">วงล้อเลือก</p><p className="text-[1.35rem] font-bold">{winner}</p></div>
        : <p className="pt-3 text-[.92rem] text-[var(--muted)]">{n < 2 ? "ใส่ตัวเลือกอย่างน้อย 2 อย่างก่อน" : spinning ? "กำลังหมุน…" : "กดปุ่มกลางวงล้อเพื่อหมุน"}</p>}
    </div>
    {winner && <div className="mt-2 flex justify-center gap-2">
      <button type="button" onClick={spin} className="tap rounded-xl bg-[var(--ink)] px-4 text-[.9rem] font-medium text-[var(--on-dark)]">หมุนอีกครั้ง</button>
      <button type="button" onClick={() => remove(items.indexOf(winner))} className="tap rounded-xl border border-[var(--line)] px-4 text-[.9rem] font-medium">ตัดตัวเลือกนี้ออก</button>
    </div>}

    <section className="card mt-6 p-4 sm:p-5" aria-label="ตัวเลือก">
      <p className="eyebrow">ตัวเลือก · {n}/{MAX}</p>
      {n === 0 && <p className="mt-2 text-[.9rem] text-[var(--muted)]">ยังไม่มีตัวเลือก พิมพ์แล้วกด + ได้เลย</p>}
      <ul className="mt-2 divide-y divide-[var(--line)]">{items.map((label, i) => <li key={`${label}-${i}`} className="flex items-center gap-3 py-1">
        <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: FILLS[i % FILLS.length] }} aria-hidden/>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <button type="button" onClick={() => remove(i)} disabled={spinning} className="tap -mr-2 grid place-items-center rounded-lg text-[var(--accent)] disabled:opacity-40" aria-label={`เอา ${label} ออก`}><Trash2 size={18}/></button>
      </li>)}</ul>
      {n < MAX && <form onSubmit={(e) => { e.preventDefault(); add(); }} className="mt-3 flex items-center gap-2">
        <Field value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="เพิ่มตัวเลือก" maxLength={40} className="min-h-[44px] py-1.5" wrapClassName="flex-1" aria-label="เพิ่มตัวเลือก"/>
        <button type="submit" disabled={!draft.trim()} className="tap grid w-12 place-items-center rounded-xl bg-[var(--ink)] text-[var(--on-dark)] disabled:opacity-40" aria-label="เพิ่ม"><Plus size={20}/></button>
      </form>}
      {n > 0 && <button type="button" onClick={() => { setItems([]); setWinner(null); }} disabled={spinning} className="tap mt-2 inline-flex items-center gap-1.5 rounded-xl px-2 text-[.88rem] font-medium text-[var(--muted)] disabled:opacity-40"><X size={16}/>ล้างทั้งหมด</button>}
    </section>
    <BottomNav {...nav}/>
  </main>;
}
