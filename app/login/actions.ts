"use server";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isPerson, OWNER, PERSON_COOKIE } from "@/lib/people";
import { ownerCookieValue } from "@/lib/person-cookie";
import { safeNext } from "@/lib/session";
import type { ActionResult } from "@/lib/types";

// A year outlasts the trip, so a phone only ever asks once unless someone switches.
const ONE_YEAR = 60 * 60 * 24 * 365;

async function remember(value: string) {
  (await cookies()).set(PERSON_COOKIE, value, { path: "/", maxAge: ONE_YEAR, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
}

// The owner's tile never submits this form, so their key arriving here means someone
// is trying to skip the PIN.
export async function signIn(formData: FormData) {
  const person = formData.get("person");
  if (!isPerson(person) || person === OWNER) redirect("/login");
  await remember(person);
  redirect(safeNext(formData.get("next")));
}

const digest = (text: string) => createHash("sha256").update(text).digest();

// Returns instead of redirecting: the PIN dialog stays open on a wrong guess, and
// moves on by itself once this says yes.
export async function signInOwner(pin: string): Promise<ActionResult> {
  const expected = process.env.OWNER_PIN, value = await ownerCookieValue();
  if (!expected || !value) return { ok: false, message: "ยังไม่ได้ตั้งค่า PIN บนเซิร์ฟเวอร์" };
  if (!timingSafeEqual(digest(String(pin)), digest(expected))) {
    // Slows guessing down a little; six digits is a family lock, not a vault.
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { ok: false, message: "PIN ไม่ถูกต้อง" };
  }
  await remember(value);
  return { ok: true };
}
