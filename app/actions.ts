"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/types";

const optionalUrl = z.union([z.literal(""), z.url({ protocol: /^https?$/ })]);
const optionalDate = z.union([z.literal(""), z.iso.date()]);
const optionalTime = z.union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)]);
const activitySchema = z.object({ tripDayId: z.string().min(1), activityId: z.string().optional(), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), name: z.string().trim().min(1).max(120), description: z.string().trim().max(1000), mapUrl: optionalUrl });

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "");
const asDate = (value: string) => (value ? new Date(`${value}T00:00:00Z`) : null);
function refresh() { revalidatePath("/", "layout"); }

// Server action errors are sanitized in production, so every action reports failure
// as a value instead — that is what the client alerts can actually display.
async function run(work: () => Promise<void>): Promise<ActionResult> {
  if (!process.env.DATABASE_URL) return { ok: false, message: "กรุณาตั้งค่า DATABASE_URL ก่อนแก้ไขข้อมูล" };
  try { await work(); refresh(); return { ok: true }; }
  catch (error) {
    if (error instanceof z.ZodError) return { ok: false, message: "ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" };
    return { ok: false, message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก" };
  }
}

export async function saveTripInfo(formData: FormData) {
  return run(async () => {
    const data = z.object({ id: z.string(), name: z.string().trim().min(1).max(120), startDate: z.iso.date(), endDate: z.iso.date() }).parse({ id: text(formData,"id"), name: text(formData,"name"), startDate: text(formData,"startDate"), endDate: text(formData,"endDate") });
    if (data.endDate < data.startDate) throw new Error("วันสิ้นสุดต้องไม่มาก่อนวันเริ่มต้น");
    await db.trip.update({ where: { id: data.id }, data: { name: data.name, startDate: new Date(`${data.startDate}T00:00:00Z`), endDate: new Date(`${data.endDate}T00:00:00Z`) } });
  });
}

export async function saveAccommodation(formData: FormData) {
  return run(async () => {
    const data = z.object({ id: z.string(), name: z.string().trim().max(160), mapUrl: optionalUrl }).parse({ id: text(formData,"id"), name: text(formData,"accommodationName"), mapUrl: text(formData,"mapUrl") });
    const value = { name: data.name, mapUrl: data.mapUrl || null };
    await db.trip.update({ where: { id: data.id }, data: { accommodation: { upsert: { create: value, update: value } } } });
  });
}

export async function saveFlights(formData: FormData) {
  return run(async () => {
    const data = z.object({ id: z.string(), takeoffDate: optionalDate, takeoffTime: optionalTime, landingTime: optionalTime, returnDate: optionalDate, returnTime: optionalTime, returnLandingTime: optionalTime })
      .parse({ id: text(formData,"id"), takeoffDate: text(formData,"takeoffDate"), takeoffTime: text(formData,"takeoffTime"), landingTime: text(formData,"landingTime"), returnDate: text(formData,"returnDate"), returnTime: text(formData,"returnTime"), returnLandingTime: text(formData,"returnLandingTime") });
    const requireBoth = (date: string, takeoff: string, label: string) => { if (date && takeoff) return; if (date || takeoff) throw new Error(`กรุณาระบุทั้งวันและเวลาออกเดินทางของ${label}`); };
    requireBoth(data.takeoffDate, data.takeoffTime, "เที่ยวบินขาไป");
    requireBoth(data.returnDate, data.returnTime, "เที่ยวบินขากลับ");
    await db.trip.update({ where: { id: data.id }, data: { takeoffDate: asDate(data.takeoffDate), takeoffTime: data.takeoffTime || null, landingTime: data.landingTime || null, returnDate: asDate(data.returnDate), returnTime: data.returnTime || null, returnLandingTime: data.returnLandingTime || null } });
  });
}

export async function saveActivity(formData: FormData) {
  return run(async () => {
    const data = activitySchema.parse({ tripDayId: text(formData,"tripDayId"), activityId: text(formData,"activityId") || undefined, time: text(formData,"time"), name: text(formData,"name"), description: text(formData,"description"), mapUrl: text(formData,"mapUrl") });
    const value = { time: data.time, name: data.name, description: data.description || null, mapUrl: data.mapUrl || null };
    if (data.activityId) await db.activity.update({ where: { id: data.activityId }, data: value });
    else {
      const aggregate = await db.activity.aggregate({ where: { tripDayId: data.tripDayId }, _max: { sortOrder: true } });
      await db.activity.create({ data: { ...value, tripDayId: data.tripDayId, sortOrder: (aggregate._max.sortOrder ?? -1) + 1 } });
    }
  });
}

export async function saveDayTitle(formData: FormData) {
  return run(async () => {
    const data = z.object({ dayId: z.string().min(1), title: z.string().trim().min(1).max(80) }).parse({ dayId: text(formData,"dayId"), title: text(formData,"title") });
    await db.tripDay.update({ where: { id: data.dayId }, data: { title: data.title } });
  });
}

export async function deleteActivity(id: string) {
  return run(async () => { await db.activity.delete({ where: { id: z.string().min(1).parse(id) } }); });
}
