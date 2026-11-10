export const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
export function shortThaiDate(iso: string) { const [y, m, d] = iso.split("-").map(Number); return `${d} ${thaiMonths[m - 1]} ${y + 543}`; }
export function dayLabel(iso: string) { const [, m, d] = iso.split("-").map(Number); return `${d} ${thaiMonths[m - 1]}`; }

// Each weekday's traditional Thai colour, Sunday first. Fixed rather than themed: the
// colour is what says which day it is. Read in UTC so the phone's own timezone can't
// shift a plain date onto the day before.
const thaiWeekdays = [
  { name: "วันอาทิตย์", color: "#e5383b" },
  { name: "วันจันทร์", color: "#f5c518" },
  { name: "วันอังคาร", color: "#f472b6" },
  { name: "วันพุธ", color: "#22a559" },
  { name: "วันพฤหัสบดี", color: "#f97316" },
  { name: "วันศุกร์", color: "#38bdf8" },
  { name: "วันเสาร์", color: "#8b5cf6" },
];
export function thaiWeekday(iso: string) { const [y, m, d] = iso.split("-").map(Number); return thaiWeekdays[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]; }

export type ClockNow = { date: string; time: string; minutes: number };

// A wall-clock reading. Each itinerary time is written in the local time of wherever
// that part of the day happens (Thai time before the flight out, Japan's after it),
// so "now" is read the same way: in the phone's own zone, which follows it from
// country to country. With no zone given this reads the runtime's own, which is the
// phone in the browser but UTC on the server; server code passes the zone the phone
// reported instead (deviceToday in lib/session.ts).
export function readClock(at = new Date(), timeZone?: string): ClockNow {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

// Fixed to Japan, for what has no phone to ask: the home-screen widget's feed and the
// stamps on notes.
export const readTokyoNow = (at = new Date()) => readClock(at, "Asia/Tokyo");
