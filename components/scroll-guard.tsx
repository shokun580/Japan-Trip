"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Every page but home scrolls. A scroll lock left behind by something that did not
// get to undo it (a dialog closed mid-navigation, a drag cut short) must never
// follow the person to the next page, so each page change clears it — unless a
// dialog is genuinely up.
export function ScrollGuard() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    if (!document.querySelector(".dialog-overlay")) { root.style.removeProperty("overflow"); document.body.style.removeProperty("overflow"); }
    delete root.dataset.dragging;
  }, [pathname]);
  return null;
}
