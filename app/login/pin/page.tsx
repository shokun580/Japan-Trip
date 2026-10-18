import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { OWNER, personName } from "@/lib/people";
import { currentPerson, safeNext } from "@/lib/session";
import { PinPad } from "@/components/pin-pad";

export const metadata: Metadata = { title: "ใส่รหัส PIN" };
// The pad fills the screen in --ink, so the status bar is painted to match instead
// of leaving a sky-blue strip above it. Keep in step with :root in globals.css.
export const viewport: Viewport = { themeColor: "#495867" };

export default async function PinPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if ((await currentPerson()) === OWNER) redirect(next);
  return <PinPad name={personName(OWNER)} next={next} />;
}
