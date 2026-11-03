"use client";
import { ArrowUpDown, X } from "lucide-react";
import { useRef, useState } from "react";
import type { YenRate } from "@/lib/rates";

// Two currencies, one box: the amount goes in on the top row and comes out on the
// bottom one; the arrow between them turns the exchange round. Digits only, shown
// with thousands separators, and no more than a shop will ever ask for.
const SIDES = { JPY: { flag: "🇯🇵", name: "เยน", sign: "¥" }, THB: { flag: "🇹🇭", name: "บาท", sign: "฿" } } as const;
type Side = keyof typeof SIDES;

// One currency's line: its flag, code and name, then whatever the row holds.
function Row({ side, children }: { side: Side; children: React.ReactNode }) {
  return <div className="money-row flex items-center gap-3">
    <span className="money-flag" aria-hidden>{SIDES[side].flag}</span>
    <span className="w-12 shrink-0"><span className="block text-[.95rem] font-semibold">{side}</span><span className="block text-[.7rem] leading-tight text-[var(--muted)]">{SIDES[side].name}</span></span>
    {children}
  </div>;
}

const format = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: n >= 100 ? 0 : 2 });

// The box starts empty: the first thing anyone types is the price in front of them.
export function Money({ rate }: { rate: YenRate | null }) {
  const [from, setFrom] = useState<Side>("JPY");
  const [amount, setAmount] = useState("");
  const box = useRef<HTMLInputElement>(null);
  // Empties the box and keeps the keyboard up for the next price.
  const clear = () => { setAmount(""); box.current?.focus(); };
  const to: Side = from === "JPY" ? "THB" : "JPY";
  const type = (value: string) => setAmount(value.replace(/\D/g, "").slice(0, 8));
  // The rate is yen to baht; the other way round is its inverse.
  const value = rate ? (Number(amount) || 0) * (from === "JPY" ? rate.rate : 1 / rate.rate) : 0;
  // Swapping keeps the number typed and turns the exchange round, as a bank app does;
  // carrying the rounded result over would drift a little on every swap.
  const swap = () => setFrom(to);

  if (rate === null) return <div className="card flex items-center gap-3 border-dashed px-4 py-3"><span className="min-w-0 flex-1"><span className="eyebrow block">เงิน</span><span className="block truncate text-[.92rem] text-[var(--muted)]">ยังไม่มีอัตราแลกเปลี่ยนวันนี้</span></span></div>;

  return <section className="card money-card px-4 pt-2 pb-2.5" aria-label="แปลงเงิน">
    <div className="flex items-baseline justify-between gap-3">
      <p className="eyebrow">เงิน · ¥100 = ฿{(rate.rate * 100).toFixed(2)}</p>
      <p className="truncate text-[.72rem] text-[var(--muted)]">{rate.note}</p>
    </div>
    <div className="money-body relative mt-1">
      <Row side={from}>
        <label className="money-box min-w-0 flex-1">
          <span className="sr-only">จำนวน{SIDES[from].name}</span>
          <input ref={box} value={amount ? Number(amount).toLocaleString("en-US") : ""} onChange={(e) => type(e.target.value)} inputMode="numeric" pattern="[0-9]*" autoComplete="off" placeholder="0" className="money-amount" aria-label={`จำนวน${SIDES[from].name}`}/>
          {/* Always there, so the box looks the same before and after typing; it only
              wakes up once there is something to clear. Holding mousedown back keeps
              the focus, and the phone keyboard, in the box. */}
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={clear} disabled={!amount} className="field-clear money-clear" aria-label="ล้างจำนวน"><span><X size={13} strokeWidth={3}/></span></button>
        </label>
      </Row>
      {/* The swap sits on the line between the rows, where the eye expects it. */}
      <div className="relative my-1 border-t border-[var(--line)]">
        <button type="button" onClick={swap} className="money-swap tap" aria-label="สลับสกุลเงิน"><ArrowUpDown size={15}/></button>
      </div>
      <Row side={to}>
        {/* The sign sits in the same column as the clear button above, so the two
            numbers end on one edge. */}
        <p className="money-result flex min-w-0 flex-1 items-baseline justify-end font-bold tabular-nums" data-empty={!amount} aria-live="polite"><span className="min-w-0 truncate">{format(value)}</span><span className="money-unit">{SIDES[to].sign}</span></p>
      </Row>
    </div>
  </section>;
}
