"use server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isPerson } from "@/lib/people";
import { defaultChecklist } from "@/lib/packing-defaults";
import type { ActionResult, ChecklistResult, CreateResult, PackingCategoryData } from "@/lib/types";

const personId = z.string().refine(isPerson, "ไม่รู้จักผู้ใช้คนนี้");
const rowId = z.string().min(1);
const label = z.string().trim().min(1, "กรุณาใส่ชื่อ").max(80);

// The checklist never calls revalidatePath: the client holds the list in state and
// patches it optimistically, so a full page revalidation would only undo that work.
const live = () => Boolean(process.env.DATABASE_URL);
const noDatabase = { ok: false as const, message: "ยังไม่ได้เชื่อมต่อฐานข้อมูล จึงบันทึกไม่ได้" };

async function run(work: () => Promise<void>): Promise<ActionResult> {
  if (!live()) return noDatabase;
  try { await work(); return { ok: true }; }
  catch (error) { return { ok: false, message: message(error) }; }
}

function message(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? "ข้อมูลที่กรอกไม่ถูกต้อง";
  // P2021/P2022 mean the checklist tables were never pushed to this database, which
  // is the one failure a reader can actually fix — so it says how.
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code: unknown }).code) : "";
  if (code === "P2021" || code === "P2022") return "ฐานข้อมูลยังไม่มีตารางของเช็คลิสต์ กรุณารัน npm run db:push";
  return error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก";
}

const starter = (): PackingCategoryData[] => defaultChecklist.map((category, c) => ({
  id: `starter-${c}`, name: category.name,
  items: category.items.map((name, i) => ({ id: `starter-${c}-${i}`, name, checked: false })),
}));

// Copying the starter list is claimed by inserting the profile row first: whoever
// wins that insert does the seeding, so two tabs opening at once cannot double it.
async function seedOnce(person: string) {
  if (await db.packingProfile.findUnique({ where: { person } })) return;
  try { await db.packingProfile.create({ data: { person } }); }
  catch { return; }
  for (const [order, category] of defaultChecklist.entries()) {
    await db.packingCategory.create({ data: {
      person, name: category.name, sortOrder: order,
      items: { create: category.items.map((name, i) => ({ name, sortOrder: i })) },
    } });
  }
}

async function read(person: string): Promise<PackingCategoryData[]> {
  const rows = await db.packingCategory.findMany({
    where: { person }, orderBy: { sortOrder: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  return rows.map((row) => ({ id: row.id, name: row.name, items: row.items.map((i) => ({ id: i.id, name: i.name, checked: i.checked })) }));
}

export async function loadChecklist(person: string): Promise<ChecklistResult> {
  if (!live()) return { ok: true, categories: starter(), saved: false };
  try {
    const key = personId.parse(person);
    await seedOnce(key);
    return { ok: true, categories: await read(key), saved: true };
  } catch (error) { return { ok: false, message: message(error) }; }
}

export async function checklistProgress(person: string): Promise<{ done: number; total: number } | null> {
  if (!live() || !isPerson(person)) return null;
  try {
    const categories = await db.packingCategory.findMany({ where: { person }, select: { id: true } });
    if (!categories.length) return null;
    const ids = categories.map((c) => c.id);
    const [total, done] = await Promise.all([
      db.packingItem.count({ where: { categoryId: { in: ids } } }),
      db.packingItem.count({ where: { categoryId: { in: ids }, checked: true } }),
    ]);
    return { done, total };
  } catch { return null; }
}

export async function setItemChecked(itemId: string, checked: boolean): Promise<ActionResult> {
  return run(async () => { await db.packingItem.update({ where: { id: rowId.parse(itemId) }, data: { checked: z.boolean().parse(checked) } }); });
}

export async function addItem(categoryId: string, name: string): Promise<CreateResult> {
  if (!live()) return noDatabase;
  try {
    const id = rowId.parse(categoryId), text = label.parse(name);
    const last = await db.packingItem.aggregate({ where: { categoryId: id }, _max: { sortOrder: true } });
    const created = await db.packingItem.create({ data: { categoryId: id, name: text, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
    return { ok: true, id: created.id };
  } catch (error) { return { ok: false, message: message(error) }; }
}

export async function renameItem(itemId: string, name: string): Promise<ActionResult> {
  return run(async () => { await db.packingItem.update({ where: { id: rowId.parse(itemId) }, data: { name: label.parse(name) } }); });
}

export async function removeItem(itemId: string): Promise<ActionResult> {
  return run(async () => { await db.packingItem.delete({ where: { id: rowId.parse(itemId) } }); });
}

export async function addCategory(person: string, name: string): Promise<CreateResult> {
  if (!live()) return noDatabase;
  try {
    const key = personId.parse(person), text = label.parse(name);
    const last = await db.packingCategory.aggregate({ where: { person: key }, _max: { sortOrder: true } });
    const created = await db.packingCategory.create({ data: { person: key, name: text, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
    return { ok: true, id: created.id };
  } catch (error) { return { ok: false, message: message(error) }; }
}

export async function renameCategory(categoryId: string, name: string): Promise<ActionResult> {
  return run(async () => { await db.packingCategory.update({ where: { id: rowId.parse(categoryId) }, data: { name: label.parse(name) } }); });
}

export async function removeCategory(categoryId: string): Promise<ActionResult> {
  return run(async () => { await db.packingCategory.delete({ where: { id: rowId.parse(categoryId) } }); });
}

export async function clearChecks(person: string): Promise<ActionResult> {
  return run(async () => {
    const key = personId.parse(person);
    const categories = await db.packingCategory.findMany({ where: { person: key }, select: { id: true } });
    await db.packingItem.updateMany({ where: { categoryId: { in: categories.map((c) => c.id) } }, data: { checked: false } });
  });
}

// Wiping the profile row too is what lets seedOnce run again on the next load.
export async function resetChecklist(person: string): Promise<ChecklistResult> {
  if (!live()) return noDatabase;
  try {
    const key = personId.parse(person);
    await db.packingCategory.deleteMany({ where: { person: key } });
    await db.packingProfile.deleteMany({ where: { person: key } });
    await seedOnce(key);
    return { ok: true, categories: await read(key), saved: true };
  } catch (error) { return { ok: false, message: message(error) }; }
}
