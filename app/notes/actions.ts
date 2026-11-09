"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { MAX_FULL_BYTES, MAX_NOTE_IMAGES, MAX_NOTE_LENGTH, MAX_NOTE_TITLE, MAX_THUMB_BYTES } from "@/lib/note-images";
import { OWNER } from "@/lib/people";
import { currentPerson } from "@/lib/session";
import type { ActionResult } from "@/lib/types";

// Notes are the group's: anyone may write one and everyone reads them. Changing or
// deleting one is for whoever wrote it, or the owner. The person comes from the
// cookie, never from the form, so no one can write as someone else.
const rowId = z.string().min(1);
const noteTitle = z.string().trim().max(MAX_NOTE_TITLE, `เรื่องยาวได้ไม่เกิน ${MAX_NOTE_TITLE} ตัวอักษร`);
const noteBody = z.string().trim().max(MAX_NOTE_LENGTH, `โน้ตยาวได้ไม่เกิน ${MAX_NOTE_LENGTH} ตัวอักษร`);

async function run(work: (person: string) => Promise<void>): Promise<ActionResult> {
  if (!process.env.DATABASE_URL) return { ok: false, message: "ยังไม่ได้เชื่อมต่อฐานข้อมูล จึงบันทึกโน้ตไม่ได้" };
  const person = await currentPerson();
  if (!person) return { ok: false, message: "กรุณาเลือกชื่อก่อน" };
  try { await work(person); revalidatePath("/notes"); return { ok: true }; }
  catch (error) {
    if (error instanceof z.ZodError) return { ok: false, message: error.issues[0]?.message ?? "ข้อมูลที่กรอกไม่ถูกต้อง" };
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code: unknown }).code) : "";
    if (code === "P2021" || code === "P2022") return { ok: false, message: "ฐานข้อมูลยังไม่มีตารางโน้ต กรุณารัน npm run db:push" };
    return { ok: false, message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก" };
  }
}

// The phone does the shrinking, so the server only has to refuse what it would not
// want to serve back from this site: anything too big, or not really a JPEG.
async function jpeg(value: FormDataEntryValue | undefined, limit: number) {
  if (!(value instanceof File) || value.size === 0 || value.size > limit) throw new Error("รูปมีขนาดใหญ่เกินไป");
  const bytes = new Uint8Array(await value.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new Error("รองรับเฉพาะไฟล์รูปภาพ");
  return bytes;
}

// The note's own pictures, or a refusal if this person may not touch it.
async function owned(noteId: string, person: string) {
  const note = await db.note.findUnique({ where: { id: rowId.parse(noteId) }, select: { createdBy: true, images: { orderBy: { sortOrder: "asc" }, select: { id: true, sortOrder: true } } } });
  if (!note) throw new Error("ไม่พบโน้ตนี้ อาจถูกลบไปแล้ว");
  if (note.createdBy !== person && person !== OWNER) throw new Error("เฉพาะคนเขียนหรือโชกุนเท่านั้นที่แก้ไขได้");
  return note.images;
}

// New and edited notes alike. `keep` lists the pictures that stay; everything else
// the note had goes, and the new photos join after the ones kept.
export async function saveNote(formData: FormData) {
  return run(async (person) => {
    const noteId = String(formData.get("noteId") ?? "");
    const title = noteTitle.parse(formData.get("title") ?? "");
    // A form sends each line break as CRLF, which would count double against the limit.
    const body = noteBody.parse(String(formData.get("body") ?? "").replace(/\r\n/g, "\n"));
    const keep = z.array(rowId).parse(formData.getAll("keep"));
    const fulls = formData.getAll("full"), thumbs = formData.getAll("thumb");
    if (fulls.length !== thumbs.length) throw new Error("ข้อมูลรูปไม่ครบ กรุณาลองใหม่");
    const added = await Promise.all(fulls.map(async (full, i) => ({ full: await jpeg(full, MAX_FULL_BYTES), thumb: await jpeg(thumbs[i], MAX_THUMB_BYTES) })));

    const kept = noteId ? (await owned(noteId, person)).filter((image) => keep.includes(image.id)) : [];
    const total = kept.length + added.length;
    if (!title && !body && total === 0) throw new Error("ใส่เรื่อง เนื้อหา หรือรูปอย่างน้อยหนึ่งอย่าง");
    if (total > MAX_NOTE_IMAGES) throw new Error(`แนบรูปได้ไม่เกิน ${MAX_NOTE_IMAGES} รูปต่อโน้ต`);

    const first = Math.max(-1, ...kept.map((image) => image.sortOrder)) + 1;
    const create = added.map((image, i) => ({ ...image, sortOrder: first + i }));
    // A nested write is one transaction: the text and the pictures change together.
    if (noteId) await db.note.update({ where: { id: noteId }, data: { title, body, images: { deleteMany: { id: { notIn: kept.map((image) => image.id) } }, create } } });
    else await db.note.create({ data: { title, body, createdBy: person, images: { create } } });
  });
}

export async function deleteNote(noteId: string) {
  return run(async (person) => { await owned(noteId, person); await db.note.delete({ where: { id: noteId } }); });
}
