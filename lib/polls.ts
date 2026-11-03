import { db } from "./db";
import type { PollData } from "./types";

// Newest first, open and closed alike; the page splits them. Counts are only filled
// in for a closed poll, so an open one carries nothing to peek at. Without a
// database there are no polls, and the page says so.
export async function getPolls(person: string): Promise<PollData[]> {
  if (!process.env.DATABASE_URL) return [];
  const rows = await db.poll.findMany({ orderBy: { createdAt: "desc" }, include: { options: { orderBy: { sortOrder: "asc" } }, votes: true } });
  return rows.map((poll) => ({
    id: poll.id, question: poll.question, createdBy: poll.createdBy,
    createdAt: poll.createdAt.toISOString(), closedAt: poll.closedAt?.toISOString() ?? null,
    options: poll.options.map((o) => ({ id: o.id, label: o.label, votes: poll.closedAt ? poll.votes.filter((v) => v.optionId === o.id).length : null })),
    myVote: poll.votes.find((v) => v.person === person)?.optionId ?? null,
    voted: poll.votes.length,
  }));
}
