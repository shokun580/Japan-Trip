import { NextResponse, type NextRequest } from "next/server";
import { getStay, getTrip } from "@/lib/data";
import { isPerson } from "@/lib/people";
import { sameText } from "@/lib/person-cookie";
import { widgetData } from "@/lib/widget";

export const dynamic = "force-dynamic";

// Read-only feed for the Scriptable home-screen widget (widgets/). The widget has no
// cookie, so proxy.ts lets this path through and WIDGET_TOKEN is the only lock. The
// script sends it as a Bearer header; ?token= also works, for checking in a browser.
// ?person= is a key from lib/people and only picks whose hotel to show.
export async function GET(request: NextRequest) {
  const expected = process.env.WIDGET_TOKEN;
  const params = request.nextUrl.searchParams;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? params.get("token") ?? "";
  if (!expected || !sameText(given, expected)) return NextResponse.json({ error: "token ไม่ถูกต้อง" }, { status: 401 });

  const person = params.get("person");
  if (!isPerson(person)) return NextResponse.json({ error: "ไม่รู้จักชื่อนี้ ใส่ key จาก lib/people.ts" }, { status: 400 });

  const trip = await getTrip();
  return NextResponse.json(widgetData(trip, await getStay(person, trip), person), { headers: { "Cache-Control": "no-store" } });
}
