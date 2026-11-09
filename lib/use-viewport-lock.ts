"use client";
import { useEffect } from "react";

// While something covers the page, the page behind stays put, and --vv-height follows
// the visual viewport so the iOS keyboard pushes that thing up instead of covering it
// (.dialog-overlay in globals.css). Holds are counted: an error alert raised over the
// note editor must not free the page when the alert alone goes away.
let holders = 0;
let release = () => {};

function hold() {
  if (holders++ > 0) return;
  const root = document.documentElement, viewport = window.visualViewport;
  const overflow = root.style.overflow;
  root.style.overflow = "hidden";
  const sync = () => {
    if (!viewport) return;
    root.style.setProperty("--vv-height", `${viewport.height}px`);
    root.style.setProperty("--vv-top", `${viewport.offsetTop}px`);
  };
  sync();
  viewport?.addEventListener("resize", sync);
  viewport?.addEventListener("scroll", sync);
  release = () => {
    root.style.overflow = overflow;
    root.style.removeProperty("--vv-height");
    root.style.removeProperty("--vv-top");
    viewport?.removeEventListener("resize", sync);
    viewport?.removeEventListener("scroll", sync);
  };
}

function letGo() { if (--holders === 0) release(); }

export function useViewportLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    hold();
    return letGo;
  }, [locked]);
}
