import type { Metadata } from "next";
import { getTrip } from "@/lib/data";
import { navFor } from "@/lib/nav";
import { signedInPerson } from "@/lib/session";
import { DecisionWheel } from "@/components/decision-wheel";

export const metadata: Metadata = { title: "วงล้อตัดสินใจ" };
export const dynamic = "force-dynamic";

// ?o= carries the choices in, one per line, so a poll can hand its options over.
export default async function WheelPage({ searchParams }: { searchParams: Promise<{ o?: string }> }) {
  const [person, trip, { o }] = await Promise.all([signedInPerson(), getTrip(), searchParams]);
  return <DecisionWheel initial={o ? o.split("\n").map((s) => s.trim()).filter(Boolean) : null} nav={await navFor(person, trip)} />;
}
