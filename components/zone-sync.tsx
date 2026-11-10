"use client";
import { useEffect } from "react";
import { ZONE_COOKIE } from "@/lib/device-zone";

// Tells the server which timezone this phone is in (see lib/device-zone.ts), and again
// whenever the app comes back to the front, since after a flight the phone has moved on.
export function ZoneSync() {
  useEffect(() => {
    const sync = () => {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!zone || document.cookie.split("; ").includes(`${ZONE_COOKIE}=${zone}`)) return;
      document.cookie = `${ZONE_COOKIE}=${zone}; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  return null;
}
