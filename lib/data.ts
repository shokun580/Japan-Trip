import { db } from "./db";
import { demoTrip } from "./demo-data";
import { people } from "./people";
import type { PersonStayData, StayData, TripData } from "./types";

const dateOnly = (date: Date) => date.toISOString().slice(0, 10);

export async function getTrip(): Promise<TripData> {
  if (!process.env.DATABASE_URL) return demoTrip;
  const trip = await db.trip.findFirst({ include: { accommodation: true, days: { orderBy: { sortOrder: "asc" }, include: { activities: { orderBy: [{ time: "asc" }, { sortOrder: "asc" }] } } } } });
  if (!trip) return demoTrip;
  return {
    id: trip.id, name: trip.name, startDate: dateOnly(trip.startDate), endDate: dateOnly(trip.endDate),
    outbound: { date: trip.takeoffDate ? dateOnly(trip.takeoffDate) : null, takeoffTime: trip.takeoffTime, landingTime: trip.landingTime },
    inbound: { date: trip.returnDate ? dateOnly(trip.returnDate) : null, takeoffTime: trip.returnTime, landingTime: trip.returnLandingTime },
    accommodation: trip.accommodation ? { name: trip.accommodation.name, mapUrl: trip.accommodation.mapUrl } : null,
    days: trip.days.map((day) => ({ id: day.id, date: dateOnly(day.date), title: day.title, sortOrder: day.sortOrder, activities: day.activities.map((a) => ({ id: a.id, time: a.time, name: a.name, description: a.description, mapUrl: a.mapUrl, sortOrder: a.sortOrder })) })),
  };
}

// Someone with a row of their own sleeps there; everyone else gets the trip's hotel.
export async function getStay(person: string, trip: TripData): Promise<StayData | null> {
  if (!process.env.DATABASE_URL) return trip.accommodation;
  const own = await db.personStay.findUnique({ where: { person } });
  return own ? { name: own.name, mapUrl: own.mapUrl } : trip.accommodation;
}

// In the order of lib/people, so the settings page lists them the way the picker does.
export async function getPersonStays(): Promise<PersonStayData[]> {
  if (!process.env.DATABASE_URL) return [];
  const rows = await db.personStay.findMany();
  const order = (key: string) => people.findIndex((p) => p.key === key);
  return rows.sort((a, b) => order(a.person) - order(b.person)).map((row) => ({ person: row.person, name: row.name, mapUrl: row.mapUrl }));
}
