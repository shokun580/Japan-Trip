"use client";
import { CircleAlert, CircleCheck, Delete, LoaderCircle, Lock, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { signInOwner } from "@/app/login/actions";

const LENGTH = 6;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "back", "0", "erase"] as const;
type Status = "idle" | "checking" | "wrong" | "done";

// Tapping the pad and typing on a keyboard feed the same `enter`, and a paste is
// taken as the whole PIN. The sixth digit submits by itself, so there is no button.
export function PinPad({ name, next }: { name: string; next: string }) {
  const router = useRouter();
  const [digits, setDigits] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [pressed, setPressed] = useState<string | null>(null);
  // A wrong PIN stays on screen through the shake before it clears; typing again
  // inside that moment cancels the clear so it cannot eat the new digits.
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = status === "checking" || status === "done";

  const submit = useCallback(async (pin: string) => {
    setStatus("checking");
    const result = await signInOwner(pin).catch(() => ({ ok: false as const, message: "เชื่อมต่อไม่สำเร็จ" }));
    if (result.ok) {
      setStatus("done");
      // A full load, so the proxy and every server component see the new cookie.
      window.location.assign(next);
      return;
    }
    setStatus("wrong");
    setMessage(result.message);
    navigator.vibrate?.(120);
    clearTimer.current = setTimeout(() => setDigits(""), 450);
  }, [next]);

  const enter = useCallback((value: string, replace = false) => {
    if (busy) return;
    if (clearTimer.current) clearTimeout(clearTimer.current);
    const start = replace || status === "wrong" ? "" : digits;
    const pin = (start + value.replace(/\D/g, "")).slice(0, LENGTH);
    setStatus("idle");
    setDigits(pin);
    if (pin.length === LENGTH) void submit(pin);
  }, [busy, status, digits, submit]);

  const erase = useCallback(() => {
    if (busy) return;
    if (clearTimer.current) clearTimeout(clearTimer.current);
    setStatus("idle");
    setDigits((d) => (status === "wrong" ? "" : d.slice(0, -1)));
  }, [busy, status]);

  const leave = useCallback(() => router.replace(next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`), [router, next]);

  // Typed keys light up the matching button, so the pad answers either way.
  const pulse = (key: string) => { setPressed(key); setTimeout(() => setPressed(null), 120); };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (/^\d$/.test(event.key)) { event.preventDefault(); enter(event.key); pulse(event.key); }
      else if (event.key === "Backspace") { event.preventDefault(); erase(); pulse("erase"); }
      else if (event.key === "Escape") leave();
    };
    const onPaste = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData("text") ?? "";
      if (/\d/.test(text)) { event.preventDefault(); enter(text, true); }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("paste", onPaste);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("paste", onPaste); };
  }, [enter, erase, leave]);

  useEffect(() => () => { if (clearTimer.current) clearTimeout(clearTimer.current); }, []);

  function press(key: (typeof KEYS)[number]) {
    if (key === "back") leave();
    else if (key === "erase") erase();
    else enter(key);
  }

  return <main className="pin-screen">
    <div className="text-center">
      <p className="text-[.85rem] text-[var(--on-dark-soft)]">เข้าใช้งานเป็น{name}</p>
      <h1 className="mt-1 text-[clamp(1.9rem,8vw,2.4rem)] leading-tight font-bold tracking-tight">ใส่รหัส PIN</h1>
    </div>

    <div className="pin-dots" data-status={status} aria-hidden>
      {Array.from({ length: LENGTH }, (_, i) => <span key={i} className="pin-dot" data-filled={i < digits.length} />)}
    </div>
    <p className="sr-only" aria-live="polite">{status === "wrong" ? message : `ใส่แล้ว ${digits.length} จาก ${LENGTH} หลัก`}</p>

    <div className="pin-keys">
      {KEYS.map((key) => <button
        key={key}
        type="button"
        onClick={() => press(key)}
        disabled={busy}
        data-pressed={pressed === key}
        className="pin-key"
        aria-label={key === "back" ? "กลับไปเลือกชื่อ" : key === "erase" ? "ลบตัวเลขล่าสุด" : key}
      >
        {key === "back" ? <Undo2 size={28} strokeWidth={1.75} /> : key === "erase" ? <Delete size={30} strokeWidth={1.75} /> : key}
      </button>)}
    </div>

    <div className="mt-auto pt-8 text-center">
      <p className="text-[.82rem] leading-relaxed text-[var(--on-dark-faint)]">PIN 6 หลักสำหรับ{name}เท่านั้น ใช้แก้ไขแผนเที่ยว<br />เครื่องนี้จะจำไว้ ไม่ต้องใส่ซ้ำ กดหรือพิมพ์ตัวเลขก็ได้</p>
      <p className="pin-status mt-4">
        {status === "checking" && <><LoaderCircle size={18} className="animate-spin" />กำลังตรวจสอบ…</>}
        {status === "wrong" && <><CircleAlert size={18} className="text-[var(--accent)]" />{message}</>}
        {status === "done" && <><CircleCheck size={18} className="text-[var(--sky)]" />ถูกต้อง กำลังเข้าใช้งาน…</>}
        {status === "idle" && <><Lock size={16} />ตรวจสอบบนเซิร์ฟเวอร์ ไม่เก็บ PIN ไว้ในเครื่อง</>}
      </p>
    </div>
  </main>;
}
