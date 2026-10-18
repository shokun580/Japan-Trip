import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ManageTabs } from "@/components/manage-tabs";
import { BottomNav } from "@/components/bottom-nav";
import { getStay, getTrip } from "@/lib/data";
import { signedInPerson } from "@/lib/session";
import { OWNER, personName } from "@/lib/people";

// This layout reads the trip, so nothing under /manage may be prerendered at build
// time — the build machine has no database to answer with.
export const dynamic = "force-dynamic";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const [person, trip] = await Promise.all([signedInPerson(), getTrip()]);
  const stay = await getStay(person, trip);
  return <main className="shell">
    <header className="mb-5 flex items-center gap-3">
      <Link href="/" className="tap grid place-items-center rounded-2xl border border-[var(--line)] bg-[var(--card)]" aria-label="กลับไปหน้าแผนเที่ยว"><ArrowLeft/></Link>
      <div><p className="eyebrow">Trip management</p><h1 className="text-2xl font-bold">จัดการแผนเที่ยว</h1></div>
    </header>
    {/* The actions refuse anyone else on their own; this only spares them a page of
        forms that would all say no. */}
    {person === OWNER ? <>
      <ManageTabs />
      {!process.env.DATABASE_URL && <div className="mb-5 rounded-2xl border border-[var(--accent)] bg-[var(--accent-wash)] p-4 text-sm">กำลังแสดงข้อมูลตัวอย่างแบบอ่านอย่างเดียว — ตั้งค่า DATABASE_URL และรัน seed เพื่อเปิดการแก้ไข</div>}
      {children}
    </> : <div className="card p-5 sm:p-7">
      <p className="font-medium">หน้านี้สำหรับ{personName(OWNER)}เท่านั้น</p>
      <p className="mt-1 text-sm text-[var(--muted)]">ถ้าอยากเปลี่ยนแผนเที่ยว ทักบอก{personName(OWNER)}ได้เลย</p>
      <Link href="/" className="tap mt-4 inline-flex items-center rounded-xl bg-[var(--ink)] px-4 font-medium text-[var(--on-dark)]">กลับไปหน้าแผนเที่ยว</Link>
    </div>}
    <BottomNav mapUrl={stay?.mapUrl ?? null} name={stay?.name} canManage={person === OWNER} />
  </main>;
}
