import { dayLabel, readTokyoNow } from "./format";
import { personName, type PersonKey } from "./people";
import { countdownLabel, dayEntries, departureAt, hasPassed } from "./timeline";
import type { StayData, TripData } from "./types";

// Everything the home-screen widget (widgets/trip-widget.js) draws, worked out here so
// the script only lays it out. Dates and times are Japan's, like the rest of the
// itinerary; `when` is that date as the widget says it ("วันนี้", "พรุ่งนี้", "13 พ.ย.").
export type WidgetData = {
  trip: string;
  person: string;
  // Today's day of the trip, null before and after it.
  day: { number: number; total: number; title: string } | null;
  // The first activity or flight that has not started yet, today or on a later day.
  next: { date: string; when: string; time: string; name: string; flight: boolean } | null;
  // The next departure still ahead, with the same countdown the flight card shows.
  flight: { date: string; when: string; time: string; label: string; countdown: string } | null;
  // Opens the hotel in Maps: its saved link, or directions by name when it has none.
  stay: { name: string; url: string } | null;
};

const addDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

export function widgetData(trip: TripData, stay: StayData | null, person: PersonKey, at = new Date()): WidgetData {
  const now = readTokyoNow(at);
  const when = (date: string) => date === now.date ? "วันนี้" : date === addDays(now.date, 1) ? "พรุ่งนี้" : dayLabel(date);

  const index = trip.days.findIndex((d) => d.date === now.date);
  const day = index < 0 ? null : { number: index + 1, total: trip.days.length, title: trip.days[index].title };

  let next: WidgetData["next"] = null;
  for (const d of trip.days.filter((d) => d.date >= now.date)) {
    const entry = dayEntries(trip, d).find((e) => !hasPassed(e.time, d.date, now));
    if (!entry) continue;
    next = { date: d.date, when: when(d.date), time: entry.time, name: entry.kind === "activity" ? entry.activity.name : entry.label, flight: entry.kind === "flight" };
    break;
  }

  const legs = ([["ขาไป", trip.outbound, "outbound"], ["ขากลับ", trip.inbound, "inbound"]] as const)
    .flatMap(([label, f, direction]) => f.date && f.takeoffTime ? [{ label, date: f.date, time: f.takeoffTime, at: departureAt(f.date, f.takeoffTime, direction) }] : []);
  const leg = legs.find((l) => l.at > at);
  const flight = leg ? { date: leg.date, when: when(leg.date), time: leg.time, label: leg.label, countdown: countdownLabel(leg.at, at) } : null;

  return {
    trip: trip.name, person: personName(person), day, next, flight,
    stay: stay && { name: stay.name, url: stay.mapUrl ?? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stay.name)}` },
  };
}
