import { getStay, getTrip } from "@/lib/data";
import { signedInPerson } from "@/lib/session";
import { Dashboard } from "@/components/dashboard";
import { getPolls } from "@/lib/polls";
import { getForecast } from "@/lib/weather";
import { readTokyoNow } from "@/lib/format";

export const dynamic = "force-dynamic";
export default async function Home() {
  const [person, trip] = await Promise.all([signedInPerson(), getTrip()]);
  const [stay, polls, forecast] = await Promise.all([getStay(person, trip), getPolls(person), getForecast(trip.days)]);
  return <Dashboard trip={trip} person={person} stay={stay} polls={polls} forecast={forecast} today={readTokyoNow().date} />;
}
