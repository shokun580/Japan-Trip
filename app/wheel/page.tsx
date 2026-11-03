import type { Metadata } from "next";
import { signedInPerson } from "@/lib/session";
import { DecisionWheel } from "@/components/decision-wheel";

export const metadata: Metadata = { title: "วงล้อตัดสินใจ" };
export const dynamic = "force-dynamic";

// ?o= carries the choices in, one per line, so a poll can hand its options over.
export default async function WheelPage({ searchParams }: { searchParams: Promise<{ o?: string }> }) {
  await signedInPerson();
  const { o } = await searchParams;
  return <DecisionWheel initial={o ? o.split("\n").map((s) => s.trim()).filter(Boolean) : null} />;
}
