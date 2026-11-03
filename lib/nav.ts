import { getStay } from "./data";
import { OWNER } from "./people";
import type { StayData, TripData } from "./types";

// What the bottom bar needs from a page: where this person sleeps, and whether
// they may set it. Pages that are not about the trip still carry the bar.
export type NavData = { mapUrl: string | null; name?: string; canManage: boolean };

export async function navFor(person: string, trip: TripData): Promise<NavData> {
  const stay: StayData | null = await getStay(person, trip);
  return { mapUrl: stay?.mapUrl ?? null, name: stay?.name, canManage: person === OWNER };
}
