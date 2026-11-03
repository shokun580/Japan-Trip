import type { Metadata } from "next";
import { getTrip } from "@/lib/data";
import { navFor } from "@/lib/nav";
import { signedInPerson } from "@/lib/session";
import { ChecklistApp } from "@/components/checklist-app";

export const metadata: Metadata = { title: "เช็คลิสต์ของใช้" };

// The list itself is fetched by the client, which patches it optimistically — the
// page only says whose list to open.
export default async function ChecklistPage() {
  const [person, trip] = await Promise.all([signedInPerson(), getTrip()]);
  return <ChecklistApp person={person} nav={await navFor(person, trip)} />;
}
