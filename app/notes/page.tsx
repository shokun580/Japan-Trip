import type { Metadata } from "next";
import { getNotes } from "@/lib/notes";
import { getTrip } from "@/lib/data";
import { navFor } from "@/lib/nav";
import { signedInPerson } from "@/lib/session";
import { NoteBoard } from "@/components/note-board";

export const metadata: Metadata = { title: "โน้ต" };
export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const [person, trip, notes] = await Promise.all([signedInPerson(), getTrip(), getNotes()]);
  return <NoteBoard person={person} notes={notes} live={Boolean(process.env.DATABASE_URL)} nav={await navFor(person, trip)} />;
}
