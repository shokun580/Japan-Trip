"use client";
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";

// The glass on the bottom bar. Press anywhere on the bar and slide: it lifts, swells
// and follows the finger, and where it is let go is where the app goes. A plain tap is
// still a tap on the link; the glass just slides over ahead of the page.
//
// Positions are in slots, 0 to 4 from the left, so drawing it needs no measuring. A
// spring moves it toward its target, and its transform is written straight onto the
// element each frame, so a drag never re-renders the bar.

const SLOTS = 5;
// Slot 2 is the hotel, a link out of the app: the glass slides past it but never stops.
const TABS = [0, 1, 3, 4];
const TOUCH_SLOP = 6;
const MOUSE_SLOP = 4;
// The bar's border and padding either side of the slots.
const BAR_INSET = 7;
const FOLLOW = { stiffness: 420, damping: 36 };
const SETTLE = { stiffness: 300, damping: 24 };
// How much bigger the glass is while held: tall enough to stand out of the bar.
const LIFT = { x: .28, y: .38 };

const nearest = (x: number) => TABS.reduce((best, tab) => (Math.abs(tab - x) < Math.abs(best - x) ? tab : best));

// Every page renders its own bar, so going to another page replaces it. The glass
// lives out here so the new bar carries on from where the old one left it, mid-slide.
const glass = { x: null as number | null, v: 0, press: 0, seen: false };
const land = (x: number) => { glass.x ??= x; };
const lift = () => { glass.x = null; glass.v = 0; glass.press = 0; };
const arrived = () => { glass.seen = true; };

// One step of the spring, dt seconds long. True once the glass has come to rest.
function advance({ target, held, still }: { target: number; held: boolean; still: boolean }, dt: number) {
  if (still) {
    glass.x = target; glass.v = 0; glass.press = held ? 1 : 0;
  } else {
    const x = glass.x ?? target;
    const { stiffness, damping } = held ? FOLLOW : SETTLE;
    glass.v += (stiffness * (target - x) - damping * glass.v) * dt;
    glass.x = x + glass.v * dt;
    glass.press += ((held ? 1 : 0) - glass.press) * Math.min(dt * 16, 1);
  }
  const resting = !held && Math.abs(target - glass.x) < .002 && Math.abs(glass.v) < .02 && glass.press < .005;
  if (resting) { glass.x = target; glass.v = 0; glass.press = 0; }
  return resting;
}

type Drag = { pointer: number; mouse: boolean; x0: number; active: boolean; left: number; cell: number; over: number | null; release: () => void };

export function useGlassLens(current: number | null, onPick: (slot: number) => void) {
  const bar = useRef<HTMLElement>(null);
  const lens = useRef<HTMLSpanElement>(null);
  const drag = useRef<Drag | null>(null);
  const run = useRef({ target: current ?? 0, held: false, still: false, frame: 0, last: 0 });
  // The bar only rises into place the first time; after that it is simply still there.
  const [settled] = useState(() => glass.seen);
  const [held, setHeld] = useState(false);
  // The tab the glass has been taken to, until the page catches up with it.
  const [under, setUnder] = useState<number | null>(null);

  const paint = () => {
    if (!lens.current || glass.x === null) return;
    // Moving fast pulls it long and thin, and it rounds out again as it slows.
    const stretch = Math.min(Math.abs(glass.v) * .03, .2);
    lens.current.style.transform = `translateX(${glass.x * 100}%) scale(${1 + glass.press * LIFT.x + stretch}, ${1 + glass.press * LIFT.y - stretch / 2})`;
  };

  const frame = (now: number) => {
    const r = run.current;
    const dt = Math.min((now - r.last) / 1000, 1 / 30);
    r.last = now;
    const resting = advance(r, dt);
    paint();
    r.frame = resting ? 0 : requestAnimationFrame(frame);
  };

  const slide = () => {
    const r = run.current;
    if (r.frame) return;
    r.still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    r.last = performance.now();
    r.frame = requestAnimationFrame(frame);
  };

  // A new bar, or a new page under this one: land where the glass already is and go
  // on from there, before the browser has drawn it anywhere else.
  useLayoutEffect(() => {
    const r = run.current;
    if (current === null) { lift(); return; }
    r.target = current;
    land(current);
    paint();
    slide();
    return () => { cancelAnimationFrame(r.frame); r.frame = 0; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- paint and slide only touch refs
  }, [current]);

  useEffect(arrived, []);

  // iOS only honours preventDefault from a touchmove listener that was already there
  // when the touch began. Once the glass is held, the finger belongs to it.
  useEffect(() => {
    const host = bar.current;
    if (!host) return;
    const hold = (event: TouchEvent) => { if (drag.current?.active) event.preventDefault(); };
    host.addEventListener("touchmove", hold, { passive: false });
    return () => {
      host.removeEventListener("touchmove", hold);
      drag.current?.release();
      delete document.documentElement.dataset.dragging;
    };
  }, []);

  const aim = (d: Drag, clientX: number) => {
    const x = (clientX - d.left) / d.cell - .5, last = SLOTS - 1;
    // Past either end it follows reluctantly, then springs back.
    const target = x < 0 ? x / 4 : x > last ? last + (x - last) / 4 : x;
    run.current.target = target;
    const tab = nearest(target);
    if (tab !== d.over) { d.over = tab; setUnder(tab); navigator.vibrate?.(8); }
  };

  const activate = (d: Drag, clientX: number) => {
    const host = bar.current;
    if (!host) return;
    const box = host.getBoundingClientRect();
    d.active = true;
    d.left = box.left + BAR_INSET;
    d.cell = (box.width - BAR_INSET * 2) / SLOTS;
    run.current.held = true;
    setHeld(true);
    document.documentElement.dataset.dragging = "";
    aim(d, clientX);
    land(run.current.target);
    slide();
  };

  const finish = (commit: boolean) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    d.release();
    if (!d.active) return;
    const r = run.current;
    r.held = false;
    setHeld(false);
    delete document.documentElement.dataset.dragging;
    // The press that ends a drag must not also count as a tap on whatever it lands on.
    const swallow = (event: MouseEvent) => { event.stopPropagation(); event.preventDefault(); };
    window.addEventListener("click", swallow, { capture: true, once: true });
    window.setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
    const tab = commit ? nearest(r.target) : current;
    // Called off on a page with no tab of its own: there is nowhere for it to rest.
    if (tab === null) { lift(); setUnder(null); return; }
    r.target = tab;
    slide();
    if (tab === current) { setUnder(null); return; }
    setUnder(tab);
    onPick(tab);
  };

  // Followed on the window: the finger is free to wander off the bar while it drags.
  const follow = (event: PointerEvent) => {
    const d = drag.current;
    if (!d || event.pointerId !== d.pointer) return;
    if (event.type === "pointercancel") { finish(false); return; }
    if (event.type === "pointerup") { if (d.active) aim(d, event.clientX); finish(true); return; }
    if (d.active) aim(d, event.clientX);
    else if (Math.abs(event.clientX - d.x0) > (d.mouse ? MOUSE_SLOP : TOUCH_SLOP)) activate(d, event.clientX);
  };

  const gestures = {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      const mouse = event.pointerType === "mouse";
      if (drag.current || (mouse && event.button !== 0) || (event.target as Element).closest(".nav-stay")) return;
      const types = ["pointermove", "pointerup", "pointercancel"] as const;
      for (const type of types) window.addEventListener(type, follow);
      drag.current = {
        pointer: event.pointerId, mouse, x0: event.clientX, active: false, left: 0, cell: 1, over: null,
        release: () => { for (const type of types) window.removeEventListener(type, follow); },
      };
    },
    // A tap: the glass sets off now, instead of waiting for the next page to arrive.
    onClickCapture: (event: ReactMouseEvent<HTMLElement>) => {
      const slot = (event.target as Element).closest<HTMLElement>("[data-slot]")?.dataset.slot;
      if (slot === undefined || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const tab = Number(slot);
      if (tab === current) return;
      run.current.target = tab;
      land(tab);
      setUnder(tab);
      slide();
    },
    // Android opens a context menu on a long press; it would cut the drag short.
    onContextMenu: (event: ReactMouseEvent<HTMLElement>) => { if (drag.current) event.preventDefault(); },
    // A mouse would otherwise pick up the link itself and drag that instead.
    onDragStart: (event: ReactMouseEvent<HTMLElement>) => event.preventDefault(),
  };

  return { bar, lens, held, settled, lit: under ?? current, gestures };
}
