import type { Metadata } from "next";
import { getPolls } from "@/lib/polls";
import { getTrip } from "@/lib/data";
import { navFor } from "@/lib/nav";
import { signedInPerson } from "@/lib/session";
import { PollBoard } from "@/components/poll-board";

export const metadata: Metadata = { title: "โหวต" };
export const dynamic = "force-dynamic";

export default async function VotePage() {
  const [person, trip] = await Promise.all([signedInPerson(), getTrip()]);
  const [polls, nav] = await Promise.all([getPolls(person), navFor(person, trip)]);
  return <PollBoard person={person} polls={polls} live={Boolean(process.env.DATABASE_URL)} nav={nav} />;
}
