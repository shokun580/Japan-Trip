import { getStay, getTrip } from "@/lib/data";
import { deviceToday, signedInPerson } from "@/lib/session";
import { Dashboard } from "@/components/dashboard";
import { getForecast } from "@/lib/weather";
import { getYenRate } from "@/lib/rates";
import { getHomeOrder } from "@/lib/home-layout";

export const dynamic = "force-dynamic";
export default async function Home() {
  const [person, trip] = await Promise.all([signedInPerson(), getTrip()]);
  const [stay, forecast, rate, order, today] = await Promise.all([getStay(person, trip), getForecast(trip.days), getYenRate(), getHomeOrder(person), deviceToday()]);
  return <Dashboard trip={trip} person={person} stay={stay} forecast={forecast} rate={rate} order={order} today={today} />;
}
