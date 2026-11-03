"use client";
import { WifiOff } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

// Installs public/sw.js, which keeps a copy of every page opened, and shows a strip
// while the phone has no connection so a plan from the cache is not mistaken for a
// live one. Only a production build registers it: in development the worker would
// hand out stale chunks while the code is still changing.

const WARM = ["/", "/plan", "/checklist", "/vote", "/settings"];

function subscribe(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => { window.removeEventListener("online", listener); window.removeEventListener("offline", listener); };
}

export function Offline() {
  // true on the server and before hydration, so the strip never flashes on load.
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => registration.active?.postMessage({ type: "warm", urls: WARM }))
      .catch(() => { /* no offline copy on this browser; the site still works */ });
  }, []);

  if (online) return null;
  return <div className="offline-bar" role="status"><WifiOff size={16} aria-hidden/>ไม่มีเน็ต · กำลังแสดงแผนที่โหลดไว้ล่าสุด แก้ไขได้เมื่อมีสัญญาณ</div>;
}
