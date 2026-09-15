import { getTrip } from "@/lib/data";
import { TripPlanner } from "@/components/trip-planner";

export const dynamic = "force-dynamic";
export default async function Home() { const trip = await getTrip(); return <TripPlanner trip={trip} />; }
