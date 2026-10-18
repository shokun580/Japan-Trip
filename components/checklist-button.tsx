"use client";
import Link from "next/link";
import { ChevronRight, ListChecks } from "lucide-react";
import { useEffect, useState } from "react";
import { personName, type PersonKey } from "@/lib/people";
import { checklistProgress } from "@/app/checklist/actions";

export function ChecklistButton({ person }: { person: PersonKey }) {
  // The summary is a second query the itinerary should not wait on, so the card
  // renders as a plain entry point and fills it in once the answer arrives.
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
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
        <span className="shrink-0 text-[.8rem] text-[var(--muted)]">· {personName(person)}</span>
      </span>
      {progress
        ? <>
            <span className="mt-1 block text-[.82rem] text-[var(--muted)]">เตรียมแล้ว {progress.done} จาก {progress.total} รายการ</span>
            <span className="meter mt-1.5"><span style={{ width: `${percent}%` }} /></span>
          </>
        : <span className="mt-0.5 block text-[.85rem] text-[var(--muted)]">เปิดดูรายการของคุณ</span>}
    </span>
    <ChevronRight size={20} className="shrink-0 text-[var(--muted)]" />
  </Link>;
}
