import { NextResponse, type NextRequest } from "next/server";
import { isPerson, PERSON_COOKIE } from "@/lib/people";

// Every page sits behind picking who you are. It is not a lock — there is no
// password and anyone can pick any name — it only makes sure each page knows whose
// hotel and checklist to show.
export function proxy(request: NextRequest) {
  if (isPerson(request.cookies.get(PERSON_COOKIE)?.value)) return NextResponse.next();
  const login = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

// The picker itself, the build's own files, and what the browser fetches for the tab
// and home-screen icon all have to load before anyone has picked a name.
export const config = { matcher: ["/((?!login|_next/|fonts/|icon\\.svg|apple-icon\\.png|favicon\\.ico).*)"] };
