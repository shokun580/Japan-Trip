import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isPerson, PERSON_COOKIE, type PersonKey } from "./people";

// proxy.ts already turns away anyone without a name, so this only re-checks it for
// the type — a page that calls it can treat the result as always present.
export async function signedInPerson(): Promise<PersonKey> {
  const value = (await cookies()).get(PERSON_COOKIE)?.value;
  if (!isPerson(value)) redirect("/login");
  return value;
}

// Only a same-site path is followed, so a crafted ?next= cannot bounce someone to
// another site after they pick their name.
export const safeNext = (value: unknown) => (typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/");
