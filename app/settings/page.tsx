import type { Metadata } from "next";
import { getStay, getTrip } from "@/lib/data";
import { OWNER } from "@/lib/people";
import { signedInPerson } from "@/lib/session";
import { BottomNav } from "@/components/bottom-nav";
import { SettingsPanel } from "@/components/settings-panel";

export const metadata: Metadata = { title: "ตั้งค่า" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [person, trip] = await Promise.all([signedInPerson(), getTrip()]);
  const stay = await getStay(person, trip);
  return <main className="shell">
    <div className="page-enter">
      <p className="eyebrow">Settings</p>
      <h1 className="text-2xl font-bold">ตั้งค่า</h1>
      <SettingsPanel person={person}/>
    </div>
    <BottomNav mapUrl={stay?.mapUrl ?? null} name={stay?.name} canManage={person === OWNER}/>
  </main>;
}
