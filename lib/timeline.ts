import type { ActivityData, DayData, TripData } from "./types";

const JAPAN_MINUTES_AHEAD_OF_THAILAND = 120;

export const toMinutes = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };

// Each leg departs from its own country, so its takeoff time is read in that
// country's zone: Thailand for the way out, Japan for the way home.
const DEPARTURE_OFFSET = { outbound: "+07:00", inbound: "+09:00" } as const;
export const departureAt = (date: string, time: string, direction: FlightDirection) => new Date(`${date}T${time}:00${DEPARTURE_OFFSET[direction]}`);

export type FlightDirection = "outbound" | "inbound";
export type TimelineEntry =
  | { kind: "activity"; id: string; time: string; activity: ActivityData }
  | { kind: "flight"; id: string; time: string; label: string; landingTime: string | null; minutes: number | null };

// Takeoff and landing are each entered in their own airport's local time, so the
// two-hour Thailand/Japan gap has to be cancelled out before the span is real.
export function flightMinutes(takeoffTime: string, landingTime: string, direction: FlightDirection) {
  const shift = direction === "outbound" ? -JAPAN_MINUTES_AHEAD_OF_THAILAND : JAPAN_MINUTES_AHEAD_OF_THAILAND;
  const span = toMinutes(landingTime) - toMinutes(takeoffTime) + shift;
  return span < 0 ? span + 1440 : span;
}

// null means the clock is not known yet (server render / pre-hydration), which the
// caller shows as the neutral state rather than guessing past or future.
export function hasPassed(entryTime: string, date: string, now: { date: string; minutes: number } | null) {
  if (!now) return null;
  if (date !== now.date) return date < now.date;
  return toMinutes(entryTime) <= now.minutes;
}

export function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  return rest ? `${hours} ชม. ${rest} นาที` : `${hours} ชม.`;
}

export function dayEntries(trip: TripData, day: DayData): TimelineEntry[] {
  const entries: TimelineEntry[] = day.activities.map((activity) => ({ kind: "activity", id: activity.id, time: activity.time, activity }));
  const flights: { direction: FlightDirection; label: string; data: TripData["outbound"] }[] = [
    { direction: "outbound", label: "เที่ยวบินขาไป", data: trip.outbound },
    { direction: "inbound", label: "เที่ยวบินขากลับ", data: trip.inbound },
  ];
  for (const { direction, label, data } of flights) {
    if (data.date !== day.date || !data.takeoffTime) continue;
    entries.push({ kind: "flight", id: `flight-${direction}`, time: data.takeoffTime, label, landingTime: data.landingTime, minutes: data.landingTime ? flightMinutes(data.takeoffTime, data.landingTime, direction) : null });
  }
  return entries.sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
}
