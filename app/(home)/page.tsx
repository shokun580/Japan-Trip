import { getStay, getTrip } from "@/lib/data";
import { signedInPerson } from "@/lib/session";
import { Dashboard } from "@/components/dashboard";
import { getForecast } from "@/lib/weather";
import { getYenRate } from "@/lib/rates";
import { readTokyoNow } from "@/lib/format";

export const dynamic = "force-dynamic";
export default async function Home() {
  const [person, trip] = await Promise.all([signedInPerson(), getTrip()]);
  const [stay, forecast, rate] = await Promise.all([getStay(person, trip), getForecast(trip.days), getYenRate()]);
  return <Dashboard trip={trip} person={person} stay={stay} forecast={forecast} rate={rate} today={readTokyoNow().date} />;
}
