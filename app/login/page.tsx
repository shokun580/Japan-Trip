import type { Metadata } from "next";
import { currentPerson, safeNext } from "@/lib/session";
import { PersonPicker } from "@/components/person-picker";
import { signIn } from "./actions";

export const metadata: Metadata = { title: "เลือกชื่อของคุณ" };

// The same page is the way in and the way to switch: whoever is already picked is
// marked, and leaving without tapping anyone keeps them.
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const current = await currentPerson();

  return <main className="shell">
    <div className="mt-8 text-center sm:mt-12">
      <p className="eyebrow">Japan companion</p>
      <h1 className="mt-2 text-[clamp(1.9rem,8vw,2.6rem)] leading-tight font-bold tracking-tight">นี่คือใคร?</h1>
      <p className="mx-auto mt-2 max-w-xs text-[.95rem] text-[var(--muted)]">แตะชื่อของคุณเพื่อเข้าแผนเที่ยว เครื่องนี้จะจำไว้ให้ ที่พักและเช็คลิสต์จะแสดงตามคนที่เลือก</p>
    </div>
    <form action={signIn}>
      <input type="hidden" name="next" value={next} />
      <PersonPicker current={current} next={next} />
    </form>
    <p className="mt-6 text-center text-[.82rem] text-[var(--muted)]">เปลี่ยนคนทีหลังได้ตลอดจากเมนูมุมบนขวา</p>
  </main>;
}
