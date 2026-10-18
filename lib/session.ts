import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OWNER, PERSON_COOKIE, type PersonKey } from "./people";
import { personFromCookie } from "./person-cookie";

export async function currentPerson(): Promise<PersonKey | null> {
  return personFromCookie((await cookies()).get(PERSON_COOKIE)?.value);
}

// proxy.ts already turns away anyone without a name, so this only re-checks it for
// the type — a page that calls it can treat the result as always present.
export async function signedInPerson(): Promise<PersonKey> {
  const person = await currentPerson();
  if (!person) redirect("/login");
  return person;
}

// Hiding the settings links is only for looks; this is the check that counts, and
// every action that changes the trip runs it on the server.
export async function isOwner() { return (await currentPerson()) === OWNER; }

// Only a same-site path is followed, so a crafted ?next= cannot bounce someone to
// another site after they pick their name.
export const safeNext = (value: unknown) => (typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/");
