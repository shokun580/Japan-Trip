import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTrip } from "@/lib/data";
import { getHomeOrder } from "@/lib/home-layout";
import { navFor } from "@/lib/nav";
import { signedInPerson } from "@/lib/session";
import { BottomNav } from "@/components/bottom-nav";
import { HomeLayoutEditor } from "@/components/home-layout-editor";

export const metadata: Metadata = { title: "จัดหน้าหลัก" };
export const dynamic = "force-dynamic";

export default async function HomeLayoutPage() {
  const [person, trip] = await Promise.all([signedInPerson(), getTrip()]);
  const [order, nav] = await Promise.all([getHomeOrder(person), navFor(person, trip)]);
  return <main className="shell">
    <div className="page-enter">
      <Link href="/settings" className="tap -ml-2 inline-flex items-center gap-1 rounded-xl px-2 font-medium text-[var(--ink)]"><ChevronLeft size={22}/>ตั้งค่า</Link>
      <p className="eyebrow mt-4">Home</p>
      <h1 className="text-2xl font-bold">จัดหน้าหลัก</h1>
      <p className="mt-1 text-[.92rem] text-[var(--muted)]">เลือกว่าจะให้ส่วนไหนอยู่ก่อนหลัง ลำดับนี้เป็นของคุณคนเดียว ใช้ได้ทุกเครื่องที่เข้าด้วยชื่อนี้</p>
      <HomeLayoutEditor initial={order} live={Boolean(process.env.DATABASE_URL)}/>
    </div>
    <BottomNav {...nav}/>
  </main>;
}
