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
export type PackingItemData = { id: string; name: string; checked: boolean };
export type PackingCategoryData = { id: string; name: string; items: PackingItemData[] };
// `saved` is false when the app runs without a database: the starter list still
// shows, but nothing the client changes will survive a reload.
export type ChecklistResult = { ok: true; categories: PackingCategoryData[]; saved: boolean } | { ok: false; message: string };
export type CreateResult = { ok: true; id: string } | { ok: false; message: string };
