export const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
export function shortThaiDate(iso: string) { const [y, m, d] = iso.split("-").map(Number); return `${d} ${thaiMonths[m - 1]} ${y + 543}`; }
export function dayLabel(iso: string) { const [, m, d] = iso.split("-").map(Number); return `${d} ${thaiMonths[m - 1]}`; }

export type TokyoNow = { date: string; time: string; minutes: number };

// Japan's wall clock, which every itinerary time is written in. It lives here rather
// than beside useTokyoNow so the server (the widget endpoint) reads the same clock.
export function readTokyoNow(at = new Date()): TokyoNow {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}
