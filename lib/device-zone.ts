// The phone's timezone, kept in a cookie so the server can work out "today" the way
// the phone sees it. Without it a page drawn on the server (in UTC) could open on a
// different day from the clock the phone then shows. ZoneSync keeps it current.
export const ZONE_COOKIE = "tz";

// Before the phone has said: everyone sets out from Thailand.
export const FALLBACK_ZONE = "Asia/Bangkok";

// Only a zone Intl knows, so a mangled cookie falls back instead of throwing.
export function knownZone(value: string | undefined): string | null {
  if (!value) return null;
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }); return value; } catch { return null; }
}
