// Yen in baht. Coinbase's exchange-rate feed moves through the day and needs no
// key, so it is the first choice, cached ten minutes; Frankfurter's ECB reference
// rate (set once each weekday) stands in when that fails. No rate at all means no
// converter today rather than a broken page.
export type YenRate = { rate: number; note: string };

const tokyoClock = (at: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(at);

async function live(): Promise<YenRate | null> {
  const response = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=JPY", { next: { revalidate: 600 } });
  if (!response.ok) return null;
  const data = (await response.json()) as { data?: { rates?: { THB?: string } } };
  const rate = Number(data.data?.rates?.THB);
  return rate > 0 ? { rate, note: `อัตราสด ${tokyoClock(new Date())}` } : null;
}

async function reference(): Promise<YenRate | null> {
  const response = await fetch("https://api.frankfurter.dev/v1/latest?from=JPY&to=THB", { next: { revalidate: 21_600 } });
  if (!response.ok) return null;
  const data = (await response.json()) as { date?: string; rates?: { THB?: number } };
  const rate = data.rates?.THB;
  return rate ? { rate, note: `อัตราอ้างอิง ECB ${data.date ?? ""}`.trim() } : null;
}

export async function getYenRate(): Promise<YenRate | null> {
  try { const rate = await live(); if (rate) return rate; } catch { /* fall through to the reference rate */ }
  try { return await reference(); } catch { return null; }
}
