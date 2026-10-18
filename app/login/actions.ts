"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isPerson, PERSON_COOKIE } from "@/lib/people";
import { safeNext } from "@/lib/session";

// A year outlasts the trip, so a phone only ever asks once unless someone switches.
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function signIn(formData: FormData) {
  const person = formData.get("person");
  if (!isPerson(person)) redirect("/login");
  (await cookies()).set(PERSON_COOKIE, person, { path: "/", maxAge: ONE_YEAR, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
  redirect(safeNext(formData.get("next")));
}
