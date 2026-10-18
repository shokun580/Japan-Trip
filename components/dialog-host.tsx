"use client";
import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import { createElement, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";

// The app's own dialogs and toasts. lib/alerts.ts is the only caller: it describes a
// dialog and awaits the answer, so components ask "are you sure?" in one line and
// never hold dialog state themselves.

export type DialogButton = { label: string; value: string; tone: "primary" | "danger" | "plain"; submit?: boolean };
export type DialogSpec = {
  icon?: "error" | "warning";
  title: string;
  text?: string;
  buttons: DialogButton[];
  // Escape and a tap on the backdrop answer with this.
  dismiss: string | null;
  input?: { value: string; placeholder?: string; maxLength: number; validate: (text: string) => string | undefined };
};
export type DialogResult = { value: string | null; text: string };

type Entry = DialogSpec & { id: number; closing: boolean; resolve: (result: DialogResult) => void; returnFocus: Element | null };
type Toast = { id: number; title: string; closing: boolean };

// Matches sheet-out and fade-out in globals.css: a closed dialog stays mounted that
// long so it can play its exit.
const EXIT_MS = 160;
const TOAST_MS = 2400;

let state: { dialogs: Entry[]; toasts: Toast[] } = { dialogs: [], toasts: [] };
const empty = state;
const listeners = new Set<() => void>();
let nextId = 1;

function update(next: Partial<typeof state>) {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

// The host gets its own React root on first use rather than a place in the layout,
// so any client component can open a dialog without a provider above it.
let mounted = false;
function ensureHost() {
  if (mounted) return;
  mounted = true;
  const node = document.createElement("div");
  node.id = "app-dialogs";
  document.body.appendChild(node);
  createRoot(node).render(createElement(DialogHost));
}

export function openDialog(spec: DialogSpec): Promise<DialogResult> {
  ensureHost();
  return new Promise((resolve) => {
    // A dialog opened from another one's answer (rename after "what do you want to
    // do?") hands focus back to whatever opened the first, not to a removed button.
    const returnFocus = state.dialogs[0]?.returnFocus ?? document.activeElement;
    update({ dialogs: [...state.dialogs, { ...spec, id: nextId++, closing: false, resolve, returnFocus }] });
  });
}

function settle(id: number, result: DialogResult) {
  const entry = state.dialogs.find((d) => d.id === id);
  if (!entry || entry.closing) return;
  // Answer first, so a follow-up dialog can rise while this one sinks out.
  entry.resolve(result);
  update({ dialogs: state.dialogs.map((d) => (d.id === id ? { ...d, closing: true } : d)) });
  window.setTimeout(() => {
    update({ dialogs: state.dialogs.filter((d) => d.id !== id) });
    if (!state.dialogs.length && entry.returnFocus instanceof HTMLElement) entry.returnFocus.focus();
  }, EXIT_MS);
}

export function showToast(title: string) {
  ensureHost();
  const id = nextId++;
  update({ toasts: [...state.toasts, { id, title, closing: false }] });
  window.setTimeout(() => dismissToast(id), TOAST_MS);
}

function dismissToast(id: number) {
  if (!state.toasts.some((t) => t.id === id && !t.closing)) return;
  update({ toasts: state.toasts.map((t) => (t.id === id ? { ...t, closing: true } : t)) });
  window.setTimeout(() => update({ toasts: state.toasts.filter((t) => t.id !== id) }), 200);
}

function DialogHost() {
  const { dialogs, toasts } = useSyncExternalStore(subscribe, () => state, () => empty);
  const active = dialogs.findLast((d) => !d.closing);
  const locked = Boolean(active);

  // The page behind stays put while a dialog is up, and the backdrop is sized to the
  // visual viewport so the iOS keyboard pushes a prompt up instead of covering it.
  useEffect(() => {
    if (!locked) return;
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
    return () => {
      root.style.overflow = overflow;
      root.style.removeProperty("--vv-height");
      root.style.removeProperty("--vv-top");
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
    };
  }, [locked]);

  return <>
    {dialogs.map((entry) => <Dialog key={entry.id} entry={entry} active={entry === active} />)}
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => <button key={toast.id} type="button" className="toast" data-closing={toast.closing} onClick={() => dismissToast(toast.id)}>
        <span className="toast-icon" aria-hidden><CircleCheck size={18} /></span>
        <span className="min-w-0">{toast.title}</span>
      </button>)}
    </div>
  </>;
}

const FOCUSABLE = "button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex='-1'])";

function Dialog({ entry, active }: { entry: Entry; active: boolean }) {
  const [text, setText] = useState(entry.input?.value ?? "");
  const [problem, setProblem] = useState<string>();
  const sheet = useRef<HTMLFormElement>(null);
  const titleId = `dialog-${entry.id}-title`, textId = `dialog-${entry.id}-text`;

  function answer(button: DialogButton | null) {
    if (button?.submit && entry.input) {
      const message = entry.input.validate(text);
      if (message) { setProblem(message); return; }
    }
    settle(entry.id, { value: button ? button.value : entry.dismiss, text });
  }

  // Re-subscribed every render so the handler always sees the current text.
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); answer(null); return; }
      if (event.key !== "Tab" || !sheet.current) return;
      // Tab cycles inside the dialog rather than wandering into the page behind it.
      const items = [...sheet.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const submit = entry.buttons.find((b) => b.submit);
  // The safe choice takes focus: the field if there is one, else the main action,
  // else Cancel — never a destructive button a stray Enter could press.
  const primary = entry.buttons.findIndex((b) => b.tone === "primary");
  const focusIndex = entry.input ? -1 : primary >= 0 ? primary : entry.buttons.findIndex((b) => b.tone === "plain");
  const IconShape = entry.icon === "error" ? CircleAlert : TriangleAlert;
  const alarming = Boolean(entry.icon) || entry.buttons.some((b) => b.tone === "danger");

  return <div className="overlay dialog-overlay" data-closing={entry.closing} onMouseDown={(event) => { if (event.target === event.currentTarget) answer(null); }}>
    <form
      ref={sheet}
      className="sheet dialog"
      role={alarming ? "alertdialog" : "dialog"}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={entry.text ? textId : undefined}
      onSubmit={(event) => { event.preventDefault(); answer(submit ?? null); }}
    >
      {entry.icon && <span className="dialog-icon" aria-hidden><IconShape size={28} strokeWidth={2} /></span>}
      <h2 id={titleId} className="text-[1.2rem] leading-snug font-semibold">{entry.title}</h2>
      {entry.text && <p id={textId} className="mt-1.5 text-[.95rem] leading-relaxed text-[var(--muted)]">{entry.text}</p>}
      {entry.input && <div className="mt-4 text-left">
        <input
          autoFocus
          className="field"
          value={text}
          onChange={(event) => { setText(event.target.value); setProblem(undefined); }}
          onFocus={(event) => event.currentTarget.select()}
          placeholder={entry.input.placeholder}
          maxLength={entry.input.maxLength}
          autoCapitalize="off"
          aria-label={entry.title}
          aria-invalid={Boolean(problem)}
        />
        {problem && <p className="mt-2 flex items-center gap-1.5 text-[.85rem] text-[var(--accent)]"><CircleAlert size={15} aria-hidden />{problem}</p>}
      </div>}
      <div className="dialog-actions" data-layout={entry.buttons.length === 2 ? "row" : "stack"}>
        {entry.buttons.map((button, i) => <button
          key={button.value}
          type={button.submit ? "submit" : "button"}
          autoFocus={i === focusIndex}
          onClick={button.submit ? undefined : () => answer(button)}
          className="tap dialog-button"
          data-tone={button.tone}
        >{button.label}</button>)}
      </div>
    </form>
  </div>;
}
