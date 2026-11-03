"use client";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";

// Pick a row up and drop it on another to swap the two. Rows are the list's
// [data-swap-id] children; anything without one (a flight) is never picked up or
// dropped on. The lifted row follows the finger through a transform written straight
// onto the element each frame, so a drag never re-renders the list.
//
// A finger has to hold still for HOLD_MS first, so an ordinary swipe over a card
// still scrolls the page; a mouse picks up as soon as it moves.

const HOLD_MS = 260;
const TOUCH_SLOP = 8;
const MOUSE_SLOP = 4;
// Within this distance of the top or bottom of the screen the page scrolls by itself.
const EDGE = 80;
// Half the gap between cards, so a finger over the gap still counts as on a card.
const REACH = 6;
const GLIDE = { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" };

type Row = { id: string; top: number; bottom: number };
type Drag = {
  id: string; el: HTMLElement; pointer: number; mouse: boolean;
  x0: number; y0: number; y: number; startY: number;
  active: boolean; hold: number; frame: number; rows: Row[]; over: string | null;
  release: () => void;
};

const rowsOf = (list: HTMLElement) => [...list.querySelectorAll<HTMLElement>(":scope > [data-swap-id]")];
const topsOf = (list: HTMLElement) => new Map(rowsOf(list).map((row) => [row.dataset.swapId!, row.getBoundingClientRect().top]));

// `order` names the rows in their current order; when it changes, every row glides
// from where it stood before the swap to its new place.
export function useDragSwap(order: string, onSwap: (from: string, to: string) => void) {
  const list = useRef<HTMLUListElement>(null);
  const drag = useRef<Drag | null>(null);
  const [lifted, setLifted] = useState<{ id: string; over: string | null } | null>(null);
  const before = useRef<Map<string, number> | null>(null);
  const refocus = useRef<string | null>(null);

  useLayoutEffect(() => {
    const from = before.current, host = list.current;
    before.current = null;
    if (!from || !host) return;
    for (const row of rowsOf(host)) {
      row.style.transform = "";
      const top = from.get(row.dataset.swapId!);
      const delta = top === undefined ? 0 : top - row.getBoundingClientRect().top;
      if (Math.abs(delta) >= 1) row.animate([{ transform: `translateY(${delta}px)` }, { transform: "none" }], GLIDE);
    }
    if (refocus.current) host.querySelector<HTMLElement>(`[data-swap-id="${refocus.current}"] [data-swap-key]`)?.focus();
    refocus.current = null;
  }, [order]);

  // iOS only honours preventDefault from a touchmove listener that was already there
  // when the touch began, and React's own touch listeners are passive. Once a row is
  // up, this is what stops the finger from scrolling the page instead.
  useEffect(() => {
    const host = list.current;
    if (!host) return;
    const hold = (event: TouchEvent) => { if (drag.current?.active) event.preventDefault(); };
    host.addEventListener("touchmove", hold, { passive: false });
    return () => {
      host.removeEventListener("touchmove", hold);
      const d = drag.current;
      if (d) { window.clearTimeout(d.hold); cancelAnimationFrame(d.frame); d.release(); }
      delete document.documentElement.dataset.dragging;
    };
  }, []);

  // Moves the lifted row under the pointer and returns the row it now hovers over.
  const place = (d: Drag) => {
    const pageY = d.y + window.scrollY;
    d.el.style.transform = `translateY(${pageY - d.startY}px)`;
    return d.rows.find((r) => r.id !== d.id && pageY >= r.top && pageY < r.bottom)?.id ?? null;
  };

  const tick = () => {
    const d = drag.current;
    if (!d?.active) return;
    const h = window.innerHeight;
    const speed = d.y < EDGE ? -(EDGE - d.y) / 5 : d.y > h - EDGE ? (d.y - (h - EDGE)) / 5 : 0;
    if (speed) window.scrollBy({ top: speed, behavior: "instant" });
    const over = place(d);
    if (over !== d.over) {
      d.over = over;
      setLifted({ id: d.id, over });
      if (over) navigator.vibrate?.(8);
    }
    d.frame = requestAnimationFrame(tick);
  };

  const activate = (d: Drag) => {
    const host = list.current;
    if (!host) return;
    d.active = true;
    const rows = rowsOf(host);
    for (const row of rows) for (const glide of row.getAnimations()) glide.finish();
    d.rows = rows.map((row) => {
      const box = row.getBoundingClientRect();
      return { id: row.dataset.swapId!, top: box.top + window.scrollY - REACH, bottom: box.bottom + window.scrollY + REACH };
    });
    document.documentElement.dataset.dragging = "";
    if (!d.mouse) navigator.vibrate?.(12);
    setLifted({ id: d.id, over: null });
    d.frame = requestAnimationFrame(tick);
  };

  const finish = (commit: boolean) => {
    const d = drag.current, host = list.current;
    drag.current = null;
    if (!d) return;
    window.clearTimeout(d.hold);
    d.release();
    if (!d.active || !host) return;
    cancelAnimationFrame(d.frame);
    delete document.documentElement.dataset.dragging;
    setLifted(null);
    // The press that ends a drag must not also count as a tap on whatever it lands on.
    const swallow = (event: MouseEvent) => { event.stopPropagation(); event.preventDefault(); };
    window.addEventListener("click", swallow, { capture: true, once: true });
    window.setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
    // Placed once more, since the last frame may predate the pointer's final move.
    const target = commit ? place(d) : null;
    if (target) {
      before.current = topsOf(host);
      onSwap(d.id, target);
      return;
    }
    // Dropped on nothing: the row slides back into its own place.
    const from = d.el.getBoundingClientRect().top;
    d.el.style.transform = "";
    const delta = from - d.el.getBoundingClientRect().top;
    if (Math.abs(delta) >= 1) d.el.animate([{ transform: `translateY(${delta}px)` }, { transform: "none" }], GLIDE);
  };

  // Followed on the window rather than the row: a mouse is not captured by the row it
  // pressed, and capturing it would send the click meant for Edit to the row instead.
  const follow = (event: PointerEvent) => {
    const d = drag.current;
    if (!d || event.pointerId !== d.pointer) return;
    if (event.type === "pointercancel") { finish(false); return; }
    d.y = event.clientY;
    if (event.type === "pointerup") { finish(true); return; }
    if (d.active) return;
    const moved = Math.hypot(event.clientX - d.x0, event.clientY - d.y0);
    // A finger that moves before the hold is up is scrolling, not dragging.
    if (moved > (d.mouse ? MOUSE_SLOP : TOUCH_SLOP)) { if (d.mouse) activate(d); else finish(false); }
  };

  const row = (id: string) => ({
    "data-swap-id": id,
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      const mouse = event.pointerType === "mouse";
      if (drag.current || (mouse && event.button !== 0)) return;
      const types = ["pointermove", "pointerup", "pointercancel"] as const;
      for (const type of types) window.addEventListener(type, follow);
      const d: Drag = {
        id, el: event.currentTarget, pointer: event.pointerId, mouse,
        x0: event.clientX, y0: event.clientY, y: event.clientY, startY: event.clientY + window.scrollY,
        active: false, hold: 0, frame: 0, rows: [], over: null,
        release: () => { for (const type of types) window.removeEventListener(type, follow); },
      };
      if (!mouse) d.hold = window.setTimeout(() => { if (drag.current === d) activate(d); }, HOLD_MS);
      drag.current = d;
    },
    // Android opens a context menu on a long press; it would cut the drag short.
    onContextMenu: (event: ReactMouseEvent<HTMLElement>) => { if (drag.current) event.preventDefault(); },
  });

  // Arrow keys swap with the neighbour above or below, for anyone not using a pointer.
  const keys = (id: string) => ({
    "data-swap-key": "",
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      const step = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
      const host = list.current;
      if (!step || !host || drag.current) return;
      event.preventDefault();
      const ids = rowsOf(host).map((el) => el.dataset.swapId!);
      const other = ids[ids.indexOf(id) + step];
      if (!other) return;
      before.current = topsOf(host);
      refocus.current = id;
      onSwap(id, other);
    },
  });

  return { list, lifted: lifted?.id ?? null, over: lifted?.over ?? null, row, keys };
}
