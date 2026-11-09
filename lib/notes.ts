import { db } from "./db";
import type { NoteData } from "./types";

// Newest first. Only the ids of the pictures are read here: their bytes are served
// one at a time by /notes/image/<id>.
export async function getNotes(): Promise<NoteData[]> {
  if (!process.env.DATABASE_URL) return [];
  // Before `db:push` has added the tables the page shows no notes rather than an
  // error; saving one then says what is missing.
  const rows = await db.note.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true, body: true, createdBy: true, createdAt: true, images: { orderBy: { sortOrder: "asc" }, select: { id: true } } } }).catch(() => []);
  return rows.map((note) => ({ id: note.id, title: note.title, body: note.body, createdBy: note.createdBy, createdAt: note.createdAt.toISOString(), images: note.images.map((image) => image.id) }));
}
