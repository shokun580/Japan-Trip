import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { APP_VERSION, changelog } from "@/lib/changelog";
import { getStay, getTrip } from "@/lib/data";
import { OWNER } from "@/lib/people";
import { signedInPerson } from "@/lib/session";
import { shortThaiDate } from "@/lib/format";
import { BottomNav } from "@/components/bottom-nav";

export const metadata: Metadata = { title: "มีอะไรใหม่" };
export const dynamic = "force-dynamic";

// Every release, newest first; the current one is marked.
export default async function ChangelogPage() {
  const [person, trip] = await Promise.all([signedInPerson(), getTrip()]);
  const stay = await getStay(person, trip);
  return <main className="shell">
    <div className="page-enter">
      <Link href="/settings" className="tap -ml-2 inline-flex items-center gap-1 rounded-xl px-2 font-medium text-[var(--ink)]"><ChevronLeft size={22}/>ตั้งค่า</Link>
      <p className="eyebrow mt-4">Patch notes</p>
      <h1 className="text-2xl font-bold">มีอะไรใหม่</h1>
      <p className="mt-1 text-[.92rem] text-[var(--muted)]">เวอร์ชันปัจจุบัน {APP_VERSION}</p>
      <ol className="mt-5 space-y-3">{changelog.map((release) => <li key={release.version} className="card p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[1.08rem] font-semibold">เวอร์ชัน {release.version}</h2>
          <p className="text-[.8rem] text-[var(--muted)]">{shortThaiDate(release.date)}{release.version === APP_VERSION && " · ปัจจุบัน"}</p>
        </div>
        <ul className="mt-2 grid gap-1.5 text-[.92rem]">{release.notes.map((note) => <li key={note} className="flex gap-2"><span className="shrink-0 text-[var(--muted)]">·</span><span>{note}</span></li>)}</ul>
      </li>)}</ol>
    </div>
    <BottomNav mapUrl={stay?.mapUrl ?? null} name={stay?.name} canManage={person === OWNER}/>
  </main>;
}
