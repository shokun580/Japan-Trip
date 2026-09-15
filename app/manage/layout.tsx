import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ManageTabs } from "@/components/manage-tabs";
import { BottomNav } from "@/components/bottom-nav";
import { getTrip } from "@/lib/data";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const trip = await getTrip();
  return <main className="shell">
    <header className="mb-5 flex items-center gap-3">
      <Link href="/" className="tap grid place-items-center rounded-2xl border border-[var(--line)] bg-[var(--card)]" aria-label="กลับไปหน้าแผนเที่ยว"><ArrowLeft/></Link>
      <div><p className="eyebrow">Trip management</p><h1 className="text-2xl font-bold">จัดการแผนเที่ยว</h1></div>
    </header>
    <ManageTabs />
    {!process.env.DATABASE_URL && <div className="mb-5 rounded-2xl border border-[var(--accent)] bg-[var(--accent-wash)] p-4 text-sm">กำลังแสดงข้อมูลตัวอย่างแบบอ่านอย่างเดียว — ตั้งค่า DATABASE_URL และรัน seed เพื่อเปิดการแก้ไข</div>}
    {children}
    <BottomNav mapUrl={trip.accommodation?.mapUrl ?? null} name={trip.accommodation?.name} />
  </main>;
}
