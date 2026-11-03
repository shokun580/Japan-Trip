import type { Metadata } from "next";
import { getStay, getTrip } from "@/lib/data";
import { getForecast } from "@/lib/weather";
import { signedInPerson } from "@/lib/session";
import { TripPlanner } from "@/components/trip-planner";

export const metadata: Metadata = { title: "แผนเที่ยว" };
export const dynamic = "force-dynamic";

// ?day= opens on that day; otherwise today, or the first day before the trip.
export default async function PlanPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const [person, trip, { day }] = await Promise.all([signedInPerson(), getTrip(), searchParams]);
  const [stay, forecast] = await Promise.all([getStay(person, trip), getForecast(trip.days)]);
  return <TripPlanner trip={trip} person={person} stay={stay} forecast={forecast} initialDayId={day ?? null}/>;
}
