import { getStay, getTrip } from "@/lib/data";
import { signedInPerson } from "@/lib/session";
import { TripPlanner } from "@/components/trip-planner";

export const dynamic = "force-dynamic";
export default async function Home() {
  const [person, trip] = await Promise.all([signedInPerson(), getTrip()]);
  return <TripPlanner trip={trip} person={person} stay={await getStay(person, trip)} />;
}
