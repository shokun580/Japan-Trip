"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { isPerson, personName, OWNER } from "@/lib/people";
import { isOwner } from "@/lib/session";
import type { ActionResult } from "@/lib/types";
import { shiftedTimes } from "@/lib/timeline";

const optionalUrl = z.union([z.literal(""), z.url({ protocol: /^https?$/ })]);
const optionalDate = z.union([z.literal(""), z.iso.date()]);
const optionalTime = z.union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)]);
const activitySchema = z.object({ tripDayId: z.string().min(1), activityId: z.string().optional(), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), name: z.string().trim().min(1).max(120), description: z.string().trim().max(1000), mapUrl: optionalUrl });

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "");
const asDate = (value: string) => (value ? new Date(`${value}T00:00:00Z`) : null);
function refresh() { revalidatePath("/", "layout"); }

// Server action errors are sanitized in production, so every action reports failure
// as a value instead — that is what the client alerts can actually display.
// Every action here changes the trip itself, so each one is the owner's alone.
async function run(work: () => Promise<void>): Promise<ActionResult> {
  if (!process.env.DATABASE_URL) return { ok: false, message: "กรุณาตั้งค่า DATABASE_URL ก่อนแก้ไขข้อมูล" };
  if (!(await isOwner())) return { ok: false, message: `เฉพาะ${personName(OWNER)}เท่านั้นที่แก้ไขแผนเที่ยวได้` };
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

const personKey = z.string().refine(isPerson);

export async function savePersonStay(formData: FormData) {
  return run(async () => {
    const data = z.object({ person: personKey, name: z.string().trim().min(1).max(160), mapUrl: optionalUrl }).parse({ person: text(formData,"person"), name: text(formData,"name"), mapUrl: text(formData,"mapUrl") });
    const value = { name: data.name, mapUrl: data.mapUrl || null };
    await db.personStay.upsert({ where: { person: data.person }, create: { person: data.person, ...value }, update: value });
  });
}

// Removing the row is all it takes to send that person back to the shared hotel.
export async function deletePersonStay(person: string) {
  return run(async () => { await db.personStay.delete({ where: { person: personKey.parse(person) } }); });
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

async function nextSortOrder(tripDayId: string) {
  const aggregate = await db.activity.aggregate({ where: { tripDayId }, _max: { sortOrder: true } });
  return (aggregate._max.sortOrder ?? -1) + 1;
}

export async function saveActivity(formData: FormData) {
  return run(async () => {
    const data = activitySchema.parse({ tripDayId: text(formData,"tripDayId"), activityId: text(formData,"activityId") || undefined, time: text(formData,"time"), name: text(formData,"name"), description: text(formData,"description"), mapUrl: text(formData,"mapUrl") });
    const value = { time: data.time, name: data.name, description: data.description || null, mapUrl: data.mapUrl || null };
    if (data.activityId) {
      // A different tripDayId is a move to another day: it joins the end of that day's
      // order, so it only breaks ties with activities already booked at the same time.
      const current = await db.activity.findUniqueOrThrow({ where: { id: data.activityId }, select: { tripDayId: true } });
      const move = current.tripDayId === data.tripDayId ? {} : { tripDayId: data.tripDayId, sortOrder: await nextSortOrder(data.tripDayId) };
      await db.activity.update({ where: { id: data.activityId }, data: { ...value, ...move } });
    }
    else await db.activity.create({ data: { ...value, tripDayId: data.tripDayId, sortOrder: await nextSortOrder(data.tripDayId) } });
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

const idPair = z.tuple([z.string().min(1), z.string().min(1)]).refine(([a, b]) => a !== b);

// Two activities trade places by trading their time; sortOrder goes with it so a pair
// booked at the same time still visibly swaps.
export async function swapActivities(firstId: string, secondId: string) {
  return run(async () => {
    const ids = idPair.parse([firstId, secondId]);
    await db.$transaction(async (tx) => {
      const rows = await tx.activity.findMany({ where: { id: { in: ids } }, select: { id: true, tripDayId: true, time: true, sortOrder: true } });
      const [a, b] = ids.map((id) => rows.find((row) => row.id === id));
      if (!a || !b) throw new Error("ไม่พบกิจกรรมที่จะสลับ อาจถูกลบไปแล้ว");
      if (a.tripDayId !== b.tripDayId) throw new Error("สลับได้เฉพาะกิจกรรมในวันเดียวกัน");
      await tx.activity.update({ where: { id: a.id }, data: { time: b.time, sortOrder: b.sortOrder } });
      await tx.activity.update({ where: { id: b.id }, data: { time: a.time, sortOrder: a.sortOrder } });
    });
  });
}

// The day's order is the timeline's: by time, then by the tie-break sortOrder.
export async function shiftActivities(dayId: string, fromId: string, minutes: number) {
  return run(async () => {
    const data = z.object({ dayId: z.string().min(1), fromId: z.string().min(1), minutes: z.number().int().min(-720).max(720).refine((m) => m !== 0) }).parse({ dayId, fromId, minutes });
    await db.$transaction(async (tx) => {
      const rows = await tx.activity.findMany({ where: { tripDayId: data.dayId }, orderBy: [{ time: "asc" }, { sortOrder: "asc" }], select: { id: true, time: true } });
      const shift = shiftedTimes(rows, data.fromId, data.minutes);
      if (!shift.ok) throw new Error(shift.message);
      for (const m of shift.moved) await tx.activity.update({ where: { id: m.id }, data: { time: m.to } });
    });
  });
}

// Two days trade their whole plan: every activity and the day's title. Flights are
// not part of a day's plan — they are pinned to the trip's dates — so they stay put.
export async function swapDays(firstId: string, secondId: string) {
  return run(async () => {
    const ids = idPair.parse([firstId, secondId]);
    await db.$transaction(async (tx) => {
      const rows = await tx.tripDay.findMany({ where: { id: { in: ids } }, select: { id: true, tripId: true, title: true, activities: { select: { id: true } } } });
      const [a, b] = ids.map((id) => rows.find((row) => row.id === id));
      if (!a || !b || a.tripId !== b.tripId) throw new Error("ไม่พบวันที่จะสลับ");
      await tx.activity.updateMany({ where: { id: { in: a.activities.map((x) => x.id) } }, data: { tripDayId: b.id } });
      await tx.activity.updateMany({ where: { id: { in: b.activities.map((x) => x.id) } }, data: { tripDayId: a.id } });
      await tx.tripDay.update({ where: { id: a.id }, data: { title: b.title } });
      await tx.tripDay.update({ where: { id: b.id }, data: { title: a.title } });
    });
  });
}
