"use client";
import { Coins } from "lucide-react";
import { useState } from "react";
import { Field } from "./field";
import type { YenRate } from "@/lib/rates";

const baht = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: n >= 100 ? 0 : 1 });

// Yen in, baht out, at the current rate — for the moment at the till when the
// price tag needs to mean something.
export function Money({ rate }: { rate: YenRate | null }) {
  const [yen, setYen] = useState("1000");
  const amount = Number(yen) || 0;
  // Digits only, and no more than a shop will ever ask for: anything else typed or
  // pasted is dropped before it lands in the box.
  const type = (value: string) => setYen(value.replace(/\D/g, "").slice(0, 8));
  if (rate === null) return <div className="card flex items-center gap-3 border-dashed px-4 py-3"><span className="min-w-0 flex-1"><span className="eyebrow block">เงิน</span><span className="block truncate text-[.92rem] text-[var(--muted)]">ยังไม่มีอัตราแลกเปลี่ยนวันนี้</span></span></div>;
  return <section className="card px-4 pt-1.5 pb-2" aria-label="แปลงเยนเป็นบาท">
    <div className="flex items-baseline justify-between gap-3">
      <p className="eyebrow">เงิน · ¥100 = ฿{(rate.rate * 100).toFixed(2)}</p>
      <p className="truncate text-[.72rem] text-[var(--muted)]">{rate.note}</p>
    </div>
    <div className="mt-1 flex items-center gap-2">
      <span className="flight-icon"><Coins size={20}/></span>
      <label className="flex min-w-0 flex-1 items-center gap-2 text-[1.05rem] font-medium">¥<Field value={yen} onChange={(e) => type(e.target.value)} inputMode="numeric" pattern="[0-9]*" autoComplete="off" className="min-h-[40px] py-1 text-[1.05rem] tabular-nums" wrapClassName="flex-1" aria-label="จำนวนเยน"/></label>
    </div>
    <p className="mt-1 flex items-baseline justify-between gap-3 pl-[50px]"><span className="text-[.8rem] text-[var(--muted)]">เท่ากับ</span><span className="text-[1.25rem] leading-none font-bold tabular-nums">฿{baht(amount * rate.rate)}</span></p>
  </section>;
}
