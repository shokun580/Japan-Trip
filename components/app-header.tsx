"use client";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { OWNER, personOf, type PersonKey } from "@/lib/people";
import { manageSections } from "./manage-tabs";

export function AppHeader({ name, dates, person }: { name: string; dates: string; person: PersonKey }) {
  const me = personOf(person);
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  return <header className="mb-6 flex items-start justify-between gap-3 sm:mb-8">
    <div className="min-w-0"><p className="eyebrow mb-1.5">Japan companion</p><h1 className="truncate text-[clamp(1.65rem,7vw,2.55rem)] leading-tight font-bold tracking-tight">{name}</h1><p className="mt-1 text-[.92rem] text-[var(--ink)] sm:text-base">{dates}</p></div>
    <div className="relative" ref={ref}>
      <button className="tap grid place-items-center rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-sm" onClick={() => setOpen(!open)} aria-label="เปิดเมนู" aria-expanded={open}><MoreVertical size={27} /></button>
      <div className="menu absolute top-14 right-0 z-30 w-60 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-2 shadow-xl" data-open={open}>
        <Link href="/login" onClick={() => setOpen(false)} className="tap flex items-center gap-3 rounded-xl px-3 py-1.5 hover:bg-[var(--sky)]">
          <span className="person-badge person-badge-xs" data-tone={me?.tone} aria-hidden>{me?.short}</span>
          <span className="min-w-0 flex-1"><span className="block truncate font-medium">{me?.name}</span><span className="block text-[.78rem] text-[var(--muted)]">แตะเพื่อเปลี่ยนคน</span></span>
        </Link>
        {person === OWNER && <>
          <div className="mx-2 my-1 border-t border-[var(--line)]" />
          {manageSections.map(({ href, label, Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className="tap flex items-center gap-3 rounded-xl px-3 font-medium hover:bg-[var(--sky)]"><Icon size={21} />{label}</Link>)}
        </>}
      </div>
    </div>
  </header>;
}
