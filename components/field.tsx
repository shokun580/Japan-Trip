"use client";
import { X } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps, type FormEvent } from "react";

// Every box in the app (.field) empties with one tap on the X at its right end. The X
// shows while the box holds something and can be edited.

type Box = HTMLInputElement | HTMLTextAreaElement;

function useClear<T extends Box>(value: unknown, defaultValue: unknown) {
  const ref = useRef<T>(null);
  const [typed, setTyped] = useState(() => String(defaultValue ?? "") !== "");
  // A controlled box says what it holds; an uncontrolled one is followed as it changes.
  const filled = value === undefined ? typed : String(value) !== "";

  useEffect(() => {
    const box = ref.current, form = box?.form;
    if (!box || !form) return;
    // React resets a form itself once its action has run, and a reset fires no input
    // event, so the box is read again right after the reset has landed.
    const sync = () => window.setTimeout(() => setTyped(box.value !== ""));
    form.addEventListener("reset", sync);
    return () => form.removeEventListener("reset", sync);
  }, []);

  const track = (event: FormEvent<T>) => setTyped(event.currentTarget.value !== "");
  const clear = () => {
    const box = ref.current;
    if (!box) return;
    // The native setter and a real input event, so a controlled box's onChange hears it
    // just as if the text had been deleted by hand.
    const proto = box instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(box, "");
    box.dispatchEvent(new Event("input", { bubbles: true }));
    box.focus();
  };
  return { ref, filled, track, clear };
}

// Out of the tab order and hidden from screen readers: the keyboard already empties a
// box, and inside a <label> its name would be read out as part of the field's own.
// Holding mousedown back keeps the focus (and the phone keyboard) in the box.
function ClearButton({ onClear }: { onClear: () => void }) {
  return <button type="button" tabIndex={-1} aria-hidden className="field-clear" onMouseDown={(event) => event.preventDefault()} onClick={onClear}>
    <span><X size={13} strokeWidth={3}/></span>
  </button>;
}

type Extra = { wrapClassName?: string };

export function Field({ className = "", wrapClassName = "", onInput, ...props }: ComponentProps<"input"> & Extra) {
  const { ref, filled, track, clear } = useClear<HTMLInputElement>(props.value, props.defaultValue);
  return <span className={`field-wrap ${wrapClassName}`}>
    <input ref={ref} {...props} onInput={(event) => { track(event); onInput?.(event); }} className={`field ${className}`}/>
    {filled && !props.disabled && !props.readOnly && <ClearButton onClear={clear}/>}
  </span>;
}

export function TextArea({ className = "", wrapClassName = "", onInput, ...props }: ComponentProps<"textarea"> & Extra) {
  const { ref, filled, track, clear } = useClear<HTMLTextAreaElement>(props.value, props.defaultValue);
  return <span className={`field-wrap ${wrapClassName}`}>
    <textarea ref={ref} {...props} onInput={(event) => { track(event); onInput?.(event); }} className={`field ${className}`}/>
    {filled && !props.disabled && !props.readOnly && <ClearButton onClear={clear}/>}
  </span>;
}
