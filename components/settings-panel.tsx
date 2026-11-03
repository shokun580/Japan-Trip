"use client";
import Link from "next/link";
import { ChevronDown, ChevronRight, Palette, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";
import { OWNER, personName, personOf, type PersonKey } from "@/lib/people";
import { APP_VERSION, changelog } from "@/lib/changelog";
import { manageSections } from "./manage-tabs";
import { ThemePicker } from "./theme-picker";

// Everyone gets their colours and the way to switch person; the owner also gets the
// doors to everything that changes the trip itself.
export function SettingsPanel({ person }: { person: PersonKey }) {
  const [themes, setThemes] = useState(false);
  const [notes, setNotes] = useState(false);
  const me = personOf(person);
  const row = "tap flex w-full items-center gap-3 rounded-2xl px-4 text-left hover:bg-[var(--sky)]";

  return <>
    <section className="card mt-5 p-2" aria-label="ของคุณ">
      <Link href="/login?next=/settings" className={row}>
        <span className="person-badge person-badge-xs" data-tone={me?.tone} aria-hidden>{me?.short}</span>
        <span className="min-w-0 flex-1"><span className="block truncate font-medium">{personName(person)}</span><span className="block text-[.78rem] text-[var(--muted)]">แตะเพื่อเปลี่ยนคน</span></span>
        <ChevronRight size={20} className="shrink-0 text-[var(--muted)]"/>
      </Link>
      <button type="button" onClick={() => setThemes(true)} className={row}>
        <span className="flight-icon"><Palette size={20}/></span>
        <span className="min-w-0 flex-1"><span className="block font-medium">ธีมสี</span><span className="block text-[.78rem] text-[var(--muted)]">เปลี่ยนได้เฉพาะเครื่องนี้ของคุณ</span></span>
        <ChevronRight size={20} className="shrink-0 text-[var(--muted)]"/>
      </button>
    </section>

    {person === OWNER && <section className="mt-5" aria-label="จัดการแผนเที่ยว">
      <p className="eyebrow px-1">จัดการแผนเที่ยว · เฉพาะ{personName(OWNER)}</p>
      <div className="card mt-2 p-2">{manageSections.map(({ href, label, Icon }) => <Link key={href} href={href} className={row}>
        <span className="flight-icon"><Icon size={20}/></span>
        <span className="min-w-0 flex-1 font-medium">{label}</span>
        <ChevronRight size={20} className="shrink-0 text-[var(--muted)]"/>
      </Link>)}</div>
    </section>}

    {person !== OWNER && <p className="mt-5 flex items-center gap-2 px-1 text-[.85rem] text-[var(--muted)]"><UserRound size={16}/>อยากเปลี่ยนแผนเที่ยว ทักบอก{personName(OWNER)}ได้เลย</p>}

    {/* The version and what came with it, folded until asked. */}
    <section className="card mt-5 p-2" aria-label="เวอร์ชัน">
      <button type="button" onClick={() => setNotes((v) => !v)} aria-expanded={notes} className={row}>
        <span className="flight-icon"><Sparkles size={20}/></span>
        <span className="min-w-0 flex-1"><span className="block font-medium">เวอร์ชัน {APP_VERSION}</span><span className="block text-[.78rem] text-[var(--muted)]">มีอะไรใหม่</span></span>
        <ChevronDown size={20} className={`shrink-0 text-[var(--muted)] transition-transform duration-200 ${notes ? "" : "-rotate-90"}`}/>
      </button>
      <div className="reveal" data-open={notes}><div>
        {changelog.map((release) => <div key={release.version} className="px-4 pt-2 pb-3">
          <p className="text-[.8rem] font-medium text-[var(--muted)]">{release.version} · {release.date}</p>
          <ul className="mt-1 grid gap-1 text-[.9rem]">{release.notes.map((note) => <li key={note} className="flex gap-2"><span className="shrink-0 text-[var(--muted)]">·</span><span>{note}</span></li>)}</ul>
        </div>)}
      </div></div>
    </section>

    <ThemePicker key={person} person={person} open={themes} onClose={() => setThemes(false)}/>
  </>;
}
