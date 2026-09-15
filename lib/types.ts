export type ActionResult = { ok: true } | { ok: false; message: string };
export type ActivityData ={ id: string; time: string; name: string; description: string | null; mapUrl: string | null; sortOrder: number };
export type DayData = { id: string; date: string; title: string; sortOrder: number; activities: ActivityData[] };
export type FlightData = { date: string | null; takeoffTime: string | null; landingTime: string | null };
export type TripData = {
  id: string; name: string; startDate: string; endDate: string;
  outbound: FlightData; inbound: FlightData;
  accommodation: { name: string; mapUrl: string | null } | null;
  days: DayData[];
};
