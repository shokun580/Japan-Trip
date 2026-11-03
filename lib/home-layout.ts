import { db } from "./db";

// The home page's sections, in their default order. A person's saved order lives
// in their Preferences row; a section added later that their row does not know yet
// is put at the end, so nobody's home page ever loses a section.
export const HOME_SECTIONS = [
  { key: "next", label: "ถัดไป", note: "กิจกรรมถัดไปและนับถอยหลัง" },
  { key: "flights", label: "เที่ยวบิน", note: "ขาที่กำลังจะถึง" },
  { key: "weather", label: "อากาศ", note: "พยากรณ์ของวันเดินทาง" },
  { key: "money", label: "เงิน", note: "แปลงเยนกับบาท" },
  { key: "checklist", label: "เช็คลิสต์", note: "ของที่เตรียมแล้ว" },
] as const;

export type HomeSection = (typeof HOME_SECTIONS)[number]["key"];
export const DEFAULT_ORDER: HomeSection[] = HOME_SECTIONS.map((s) => s.key);
const known = new Set<string>(DEFAULT_ORDER);

export function normalizeOrder(saved: readonly string[] | null | undefined): HomeSection[] {
  const kept = (saved ?? []).filter((k, i, all): k is HomeSection => known.has(k) && all.indexOf(k) === i);
  return [...kept, ...DEFAULT_ORDER.filter((k) => !kept.includes(k))];
}

// Without a database, or before the table exists, everyone sees the default.
export async function getHomeOrder(person: string): Promise<HomeSection[]> {
  if (!process.env.DATABASE_URL) return DEFAULT_ORDER;
  try {
    const row = await db.preferences.findUnique({ where: { person }, select: { homeSections: true } });
    return normalizeOrder(row?.homeSections);
  } catch { return DEFAULT_ORDER; }
}
