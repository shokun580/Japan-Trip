"use client";
import { Coins } from "lucide-react";
import { useState } from "react";
import { Field } from "./field";

const baht = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: n >= 100 ? 0 : 1 });

// Yen in, baht out, at today's rate — for the moment at the till when the price
// tag needs to mean something.
export function Money({ rate }: { rate: number | null }) {
  const [yen, setYen] = useState("1000");
  const amount = Number(yen.replace(/[^\d.]/g, "")) || 0;
  if (rate === null) return <div className="card flex items-center gap-3 border-dashed px-4 py-3"><span className="min-w-0 flex-1"><span className="eyebrow block">เงิน</span><span className="block truncate text-[.92rem] text-[var(--muted)]">ยังไม่มีอัตราแลกเปลี่ยนวันนี้</span></span></div>;
  return <section className="card flex items-center gap-3 px-4 py-2.5" aria-label="แปลงเยนเป็นบาท">
    <span className="flight-icon"><Coins size={20}/></span>
    <div className="min-w-0 flex-1">
      <p className="eyebrow">เงิน · ¥100 = ฿{(rate * 100).toFixed(2)}</p>
      <div className="mt-1 flex items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-1.5 text-[.95rem]">¥<Field value={yen} onChange={(e) => setYen(e.target.value)} inputMode="numeric" className="min-h-[38px] py-1 tabular-nums" wrapClassName="flex-1" aria-label="จำนวนเยน"/></label>
        <span className="shrink-0 text-[1.05rem] font-semibold tabular-nums">= ฿{baht(amount * rate)}</span>
      </div>
    </div>
  </section>;
}
