import Link from "next/link";
import { House, MapPinned } from "lucide-react";

export function BottomNav({ mapUrl, name }: { mapUrl: string | null; name?: string }) {
  return <nav aria-label="เมนูหลัก" className="fixed right-0 bottom-0 left-0 z-40 border-t border-[var(--line)] bg-[var(--card)]/95 px-4 pb-[max(10px,env(safe-area-inset-bottom))] backdrop-blur">
    <div className="mx-auto max-w-sm pt-2">
      {mapUrl
        ? <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="tap flex items-center justify-center gap-2 rounded-xl bg-[var(--ink)] text-[.95rem] font-medium text-[var(--on-dark)]" aria-label={`เปิดแผนที่${name ? ` ${name}` : "ที่พัก"}`}><MapPinned size={21}/>ไปที่พัก</a>
        : <Link href="/manage/stay" className="tap flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line-strong)] text-[.95rem] font-medium text-[var(--muted)]"><House size={21}/>ตั้งค่าลิงก์ที่พัก</Link>}
    </div>
  </nav>;
}
