"use client";
import Link from "next/link";
import { ChevronRight, ListChecks } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { personName } from "@/lib/people";
import { currentPerson, noPerson, subscribePerson } from "@/lib/checklist-store";
import { checklistProgress } from "@/app/checklist/actions";

export function ChecklistButton() {
  // The phone is the only place that knows whose list this is, so the card renders
  // as a plain entry point on the server and fills in the summary once hydrated.
  const person = useSyncExternalStore(subscribePerson, currentPerson, noPerson);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    if (!person) return;
    let current = true;
    void checklistProgress(person).then((result) => { if (current) setProgress(result); }).catch(() => {});
    return () => { current = false; };
  }, [person]);

  const percent = progress?.total ? (progress.done / progress.total) * 100 : 0;

  return <Link href="/checklist" className="card mt-4 flex items-center gap-3 p-4 transition-transform active:scale-[.99]" aria-label="เปิดเช็คลิสต์ของใช้">
    <span className="flight-icon"><ListChecks size={21} /></span>
    <span className="min-w-0 flex-1">
      <span className="flex items-baseline gap-2">
        <span className="truncate font-semibold">เช็คลิสต์ของใช้</span>
        {person && <span className="shrink-0 text-[.8rem] text-[var(--muted)]">· {personName(person)}</span>}
      </span>
      {progress
        ? <>
            <span className="mt-1 block text-[.82rem] text-[var(--muted)]">เตรียมแล้ว {progress.done} จาก {progress.total} รายการ</span>
            <span className="meter mt-1.5"><span style={{ width: `${percent}%` }} /></span>
          </>
        : <span className="mt-0.5 block text-[.85rem] text-[var(--muted)]">{person ? "เปิดดูรายการของคุณ" : "เลือกชื่อแล้วเริ่มเช็กของได้เลย"}</span>}
    </span>
    <ChevronRight size={20} className="shrink-0 text-[var(--muted)]" />
  </Link>;
}
