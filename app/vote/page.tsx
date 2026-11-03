import type { Metadata } from "next";
import { getPolls } from "@/lib/polls";
import { signedInPerson } from "@/lib/session";
import { PollBoard } from "@/components/poll-board";

export const metadata: Metadata = { title: "โหวต" };
export const dynamic = "force-dynamic";

export default async function VotePage() {
  const person = await signedInPerson();
  return <PollBoard person={person} polls={await getPolls(person)} live={Boolean(process.env.DATABASE_URL)} />;
}
