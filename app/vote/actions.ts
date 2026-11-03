"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { OWNER } from "@/lib/people";
import { currentPerson } from "@/lib/session";
import type { ActionResult } from "@/lib/types";

// Polls are the group's, not the trip's: anyone may open one and everyone votes.
// Closing or deleting one is for whoever opened it, or the owner. The person comes
// from the cookie, never from the form, so no one can vote as someone else.
const rowId = z.string().min(1);
const question = z.string().trim().min(1, "กรุณาใส่คำถาม").max(120);
const option = z.string().trim().min(1).max(60);

async function run(work: (person: string) => Promise<void>): Promise<ActionResult> {
  if (!process.env.DATABASE_URL) return { ok: false, message: "ยังไม่ได้เชื่อมต่อฐานข้อมูล จึงโหวตไม่ได้" };
  const person = await currentPerson();
  if (!person) return { ok: false, message: "กรุณาเลือกชื่อก่อน" };
  try { await work(person); revalidatePath("/vote"); revalidatePath("/"); return { ok: true }; }
  catch (error) {
    if (error instanceof z.ZodError) return { ok: false, message: error.issues[0]?.message ?? "ข้อมูลที่กรอกไม่ถูกต้อง" };
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code: unknown }).code) : "";
    if (code === "P2021" || code === "P2022") return { ok: false, message: "ฐานข้อมูลยังไม่มีตารางโหวต กรุณารัน npm run db:push" };
    return { ok: false, message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก" };
  }
}

export async function createPoll(formData: FormData) {
  return run(async (person) => {
    const data = z.object({
      question,
      // Blank rows are the unused extras in the form, not a mistake.
      options: z.array(option).min(2, "ต้องมีตัวเลือกอย่างน้อย 2 ข้อ").max(10, "ตัวเลือกได้ไม่เกิน 10 ข้อ"),
    }).parse({ question: formData.get("question"), options: formData.getAll("option").map(String).map((s) => s.trim()).filter(Boolean) });
    await db.poll.create({ data: { question: data.question, createdBy: person, options: { create: data.options.map((label, i) => ({ label, sortOrder: i })) } } });
  });
}

export async function castVote(pollId: string, optionId: string) {
  return run(async (person) => {
    const ids = z.object({ pollId: rowId, optionId: rowId }).parse({ pollId, optionId });
    const poll = await db.poll.findUnique({ where: { id: ids.pollId }, select: { closedAt: true, options: { where: { id: ids.optionId }, select: { id: true } } } });
    if (!poll || !poll.options.length) throw new Error("ไม่พบตัวเลือกนี้ โหวตอาจถูกลบไปแล้ว");
    if (poll.closedAt) throw new Error("โหวตนี้ปิดไปแล้ว");
    await db.pollVote.upsert({ where: { pollId_person: { pollId: ids.pollId, person } }, create: { pollId: ids.pollId, person, optionId: ids.optionId }, update: { optionId: ids.optionId } });
  });
}

async function owned(pollId: string, person: string) {
  const poll = await db.poll.findUnique({ where: { id: rowId.parse(pollId) }, select: { createdBy: true } });
  if (!poll) throw new Error("ไม่พบโหวตนี้");
  if (poll.createdBy !== person && person !== OWNER) throw new Error("เฉพาะคนที่ตั้งโหวตหรือโชกุนเท่านั้นที่ทำได้");
}

export async function closePoll(pollId: string) {
  return run(async (person) => { await owned(pollId, person); await db.poll.update({ where: { id: pollId }, data: { closedAt: new Date() } }); });
}

export async function reopenPoll(pollId: string) {
  return run(async (person) => { await owned(pollId, person); await db.poll.update({ where: { id: pollId }, data: { closedAt: null } }); });
}

export async function deletePoll(pollId: string) {
  return run(async (person) => { await owned(pollId, person); await db.poll.delete({ where: { id: pollId } }); });
}
