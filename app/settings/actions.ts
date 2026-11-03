"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { DEFAULT_ORDER } from "@/lib/home-layout";
import { themes } from "@/lib/themes";
import { currentPerson } from "@/lib/session";
import type { ActionResult } from "@/lib/types";

// Each person arranges their own home page; the cookie says whose, never the form.
// Only a reordering of the known sections is accepted.
const order = z.array(z.enum(DEFAULT_ORDER as [string, ...string[]])).refine((keys) => keys.length === DEFAULT_ORDER.length && new Set(keys).size === keys.length, "ลำดับไม่ครบ");

const themeKey = z.enum(themes.map((t) => t.key) as [string, ...string[]]);

// Both write the person's own Preferences row, creating it on first use.
async function savePreference(data: { homeSections?: string[]; theme?: string }, paths: string[]): Promise<ActionResult> {
  if (!process.env.DATABASE_URL) return { ok: false, message: "ยังไม่ได้เชื่อมต่อฐานข้อมูล จึงบันทึกไม่ได้" };
  const person = await currentPerson();
  if (!person) return { ok: false, message: "กรุณาเลือกชื่อก่อน" };
  try {
    await db.preferences.upsert({ where: { person }, create: { person, ...data }, update: data });
    for (const path of paths) revalidatePath(path, "layout");
    return { ok: true };
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code: unknown }).code) : "";
    if (code === "P2021" || code === "P2022") return { ok: false, message: "ฐานข้อมูลยังไม่มีตารางการตั้งค่า กรุณารัน npm run db:push" };
    return { ok: false, message: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ" };
  }
}

export async function saveHomeOrder(sections: string[]): Promise<ActionResult> {
  const parsed = order.safeParse(sections);
  if (!parsed.success) return { ok: false, message: "ลำดับไม่ถูกต้อง" };
  return savePreference({ homeSections: parsed.data }, ["/"]);
}

// The theme is drawn on the server from here (app/layout.tsx), so every page needs
// the new one: the whole layout is revalidated.
export async function saveTheme(key: string): Promise<ActionResult> {
  const parsed = themeKey.safeParse(key);
  if (!parsed.success) return { ok: false, message: "ไม่รู้จักธีมนี้" };
  return savePreference({ theme: parsed.data }, ["/"]);
}
