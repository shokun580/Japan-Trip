"use client";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { saveDayTitle } from "@/app/actions";
import { alertError } from "@/lib/alerts";

export function DayTitleField({ dayId, title }: { dayId: string; title: string }) {
  const [value, setValue] = useState(title);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const saved = useRef(title);

  useEffect(() => {
    const next = value.trim();
    // Skip an empty box so a mid-edit clear never wipes the stored title.
    if (!next || next === saved.current) return;
    const timer = window.setTimeout(async () => {
      setState("saving");
      const formData = new FormData();
      formData.set("dayId", dayId);
      formData.set("title", next);
      const result = await saveDayTitle(formData);
      if (result.ok) { saved.current = next; setState("saved"); } else { setState("idle"); alertError(result.message); }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [value, dayId]);

  return <label className="label">
    <span className="flex items-center gap-2">ชื่อวัน
      {state === "saving" && <span className="text-xs font-normal text-[var(--muted)]">กำลังบันทึก…</span>}
      {state === "saved" && <span className="inline-flex items-center gap-1 text-xs font-normal text-[var(--muted)]"><Check size={13}/>บันทึกแล้ว</span>}
    </span>
    <input className="field" value={value} onChange={(event) => { setValue(event.target.value); setState("idle"); }} maxLength={80} aria-label="ชื่อวัน"/>
  </label>;
}
