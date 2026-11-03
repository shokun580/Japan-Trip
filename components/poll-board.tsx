"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronLeft, Disc3, Lock, LockOpen, Plus, Trash2, X } from "lucide-react";
import { useEffect, useOptimistic, useState, startTransition } from "react";
import type { PollData } from "@/lib/types";
import { OWNER, people, personName } from "@/lib/people";
import { castVote, closePoll, createPoll, deletePoll, reopenPoll } from "@/app/vote/actions";
import { alertError, confirmAction, toastSuccess } from "@/lib/alerts";
import { Field } from "./field";
import { DecideTabs } from "./decide-tabs";
import { BottomNav } from "./bottom-nav";
import type { NavData } from "@/lib/nav";
import { reach } from "@/lib/reach";

const REFRESH_MS = 20_000;
const timeLabel = (iso: string) => new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Tokyo", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function PollBoard({ person, polls, live, nav }: { person: string; polls: PollData[]; live: boolean; nav: NavData }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  // Other people's votes arrive on a refresh, so the page asks for one every so often
  // while it is in front; a tap on an option brings the next one at once.
  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") router.refresh(); };
    const timer = window.setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [router]);

  const open = polls.filter((p) => !p.closedAt), closed = polls.filter((p) => p.closedAt);

  return <main className="shell">
    <header className="flex items-center justify-between gap-3">
      <Link href="/" className="tap -ml-2 flex items-center gap-1 rounded-xl px-2 font-medium text-[var(--ink)]"><ChevronLeft size={22} />กลับ</Link>
      {live && <button onClick={() => setCreating(true)} className="tap inline-flex items-center gap-2 rounded-2xl bg-[var(--ink)] px-4 font-medium text-[var(--on-dark)]"><Plus size={20}/>ตั้งโหวต</button>}
    </header>

    <div className="mt-5">
      <p className="eyebrow">ตัดสินใจด้วยกัน</p>
      <h1 className="text-[1.45rem] leading-tight font-bold tracking-tight">โหวต</h1>
      <p className="mt-1 text-[.92rem] text-[var(--muted)]">ใครตั้งคำถามก็ได้ ทุกคนโหวตได้คนละเสียงแบบลับ เปลี่ยนใจได้จนกว่าจะปิดโหวต แล้วค่อยเห็นคะแนน</p>
    </div>
    <DecideTabs/>

    {!live && <p className="mt-4 rounded-2xl border border-dashed border-[var(--line-strong)] p-3 text-[.85rem] text-[var(--muted)]">โหมดตัวอย่าง: ยังไม่ได้ต่อฐานข้อมูล จึงยังตั้งโหวตไม่ได้</p>}

    {live && open.length === 0 && <div className="card mt-5 p-5 text-center">
      <p className="font-medium">ยังไม่มีโหวตที่เปิดอยู่</p>
      <p className="mt-1 text-[.9rem] text-[var(--muted)]">ตัดสินใจอะไรไม่ได้ ตั้งคำถามให้ทุกคนช่วยเลือกได้เลย</p>
    </div>}
    <section className="mt-5 space-y-3" aria-label="โหวตที่เปิดอยู่">{open.map((poll) => <PollCard key={poll.id} poll={poll} person={person}/>)}</section>

    {closed.length > 0 && <section className="mt-8" aria-label="ประวัติการโหวต">
      <p className="eyebrow">ประวัติ · {closed.length} โหวต</p>
      <div className="mt-2 space-y-3">{closed.map((poll) => <PollCard key={poll.id} poll={poll} person={person}/>)}</div>
    </section>}

    {creating && <CreateSheet onClose={() => setCreating(false)}/>}
    <BottomNav {...nav}/>
  </main>;
}

function PollCard({ poll, person }: { poll: PollData; person: string }) {
  const [busy, setBusy] = useState(false);
  // A closed poll folds to its question and result, so a long history stays short.
  const [expanded, setExpanded] = useState(false);
  // My own tap shows at once; the refresh that follows confirms it.
  const [shown, showVote] = useOptimistic(poll, (current, optionId: string) => ({ ...current, myVote: optionId, voted: current.voted + (current.myVote ? 0 : 1) }));
  const closed = Boolean(shown.closedAt);
  const count = (o: { votes: number | null }) => o.votes ?? 0;
  const top = Math.max(0, ...shown.options.map(count));
  const leaders = shown.options.filter((o) => count(o) === top && top > 0);
  const mine = shown.createdBy === person || person === OWNER;

  const vote = (optionId: string) => {
    if (closed || optionId === shown.myVote) return;
    startTransition(async () => {
      showVote(optionId);
      const result = await reach(castVote(poll.id, optionId));
      if (!result.ok) alertError(result.message);
    });
  };
  const act = async (label: string, work: () => Promise<{ ok: boolean; message?: string }>) => {
    setBusy(true); const result = await reach(work()); setBusy(false);
    if (result.ok) toastSuccess(label); else alertError("message" in result && result.message ? result.message : "ไม่สำเร็จ");
  };
  const remove = async () => {
    if (!(await confirmAction("ลบโหวตนี้?", shown.question, "ลบเลย"))) return;
    await act("ลบโหวตแล้ว", () => deletePoll(poll.id));
  };
  const wheelHref = `/wheel?o=${encodeURIComponent((leaders.length > 1 ? leaders : shown.options).map((o) => o.label).join("\n"))}`;

  const result = closed && top > 0 ? (leaders.length > 1 ? `เสมอกัน ${leaders.length} ตัวเลือก` : `ผล: ${leaders[0].label}`) : null;
  const head = <>
    <div className="min-w-0 flex-1">
      <h2 className="text-[1.08rem] leading-snug font-semibold">{shown.question}</h2>
      <p className="mt-1 text-[.8rem] text-[var(--muted)]">ตั้งโดย {personName(shown.createdBy)} · {timeLabel(shown.createdAt)}{closed && ` · ปิดแล้ว`}</p>
      {closed && !expanded && <p className="mt-1 truncate text-[.9rem] font-medium">{result ?? "ไม่มีใครโหวต"}</p>}
    </div>
    {closed
      ? <ChevronDown size={20} className={`mt-1 shrink-0 text-[var(--muted)] transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`}/>
      : null}
  </>;

  return <article className="card p-4 sm:p-5" data-closed={closed}>
    {closed
      ? <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="flex w-full items-start gap-3 text-left">{head}</button>
      : <div className="flex items-start gap-3">{head}</div>}

    <div className={closed ? "reveal" : undefined} data-open={closed ? expanded : undefined}><div>
    {/* Open: a plain list where only my own choice is marked. Closed: the counts,
        a bar for each share, and the winner outlined. */}
    <ul className="mt-3 grid gap-2">{shown.options.map((o) => {
      const share = closed && shown.voted ? (count(o) / shown.voted) * 100 : 0;
      const won = closed && leaders.includes(o);
      return <li key={o.id}>
        <button type="button" onClick={() => vote(o.id)} disabled={closed} aria-pressed={o.id === shown.myVote} className="poll-option tap w-full text-left" data-won={won}>
          {closed && <span className="poll-bar" style={{ width: `${share}%` }} aria-hidden/>}
          <span className="relative flex items-center gap-3">
            <span className="min-w-0 flex-1 truncate font-medium">{o.label}</span>
            {o.id === shown.myVote && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--ink)] px-2 py-0.5 text-[.72rem] font-medium text-[var(--on-dark)]"><Check size={12}/>ของคุณ</span>}
            {closed && <span className="shrink-0 text-[.95rem] font-semibold tabular-nums">{count(o)}</span>}
          </span>
        </button>
      </li>;
    })}</ul>

    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[.85rem] text-[var(--muted)]">
      <span>{shown.voted} จาก {people.length} คนโหวตแล้ว{!closed && (shown.myVote ? " · เปลี่ยนใจได้จนกว่าจะปิด" : " · คุณยังไม่ได้โหวต")}</span>
      {result && <span className="font-medium text-[var(--ink)]">{result}</span>}
    </div>

    {(mine || (closed && leaders.length > 1)) && <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
      {closed && leaders.length > 1 && <Link href={wheelHref} className="tap inline-flex items-center gap-1.5 rounded-xl bg-[var(--sky)] px-3.5 text-[.88rem] font-medium"><Disc3 size={17}/>ตัดสินด้วยวงล้อ</Link>}
      {mine && (closed
        ? <button onClick={() => act("เปิดโหวตอีกครั้งแล้ว", () => reopenPoll(poll.id))} disabled={busy} className="tap inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3.5 text-[.88rem] font-medium disabled:opacity-40"><LockOpen size={17}/>เปิดอีกครั้ง</button>
        : <button onClick={() => act("ปิดโหวตแล้ว", () => closePoll(poll.id))} disabled={busy} className="tap inline-flex items-center gap-1.5 rounded-xl bg-[var(--ink)] px-3.5 text-[.88rem] font-medium text-[var(--on-dark)] disabled:opacity-40"><Lock size={17}/>ปิดโหวต</button>)}
      {mine && <button onClick={remove} disabled={busy} className="tap ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 text-[.88rem] font-medium text-[var(--accent)] disabled:opacity-40" aria-label="ลบโหวต"><Trash2 size={17}/>ลบ</button>}
    </div>}
    </div></div>
  </article>;
}

const MIN_OPTIONS = 2, MAX_OPTIONS = 10;

function CreateSheet({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState(3);
  const [busy, setBusy] = useState(false);
  const [closing, setClosing] = useState(false);
  // Same exit as the other sheets; the length matches sheet-out in globals.css.
  const close = () => { setClosing(true); window.setTimeout(() => { setClosing(false); onClose(); }, 160); };

  return <div className="overlay fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/55 p-4 sm:p-5" data-closing={closing} role="dialog" aria-modal="true" aria-labelledby="poll-title">
    <div className="sheet max-h-[92dvh] w-full max-w-lg overflow-auto rounded-[28px] bg-[var(--card)] p-5 shadow-2xl sm:p-7">
      <div className="flex items-center justify-between">
        <h2 id="poll-title" className="text-2xl font-bold">ตั้งโหวต</h2>
        <button onClick={close} className="tap grid place-items-center rounded-full" aria-label="ปิด"><X/></button>
      </div>
      <form action={async (formData) => {
        setBusy(true); const result = await reach(createPoll(formData)); setBusy(false);
        if (!result.ok) { alertError(result.message); return; }
        toastSuccess("ตั้งโหวตแล้ว"); close();
      }} className="mt-5 grid gap-4">
        <label className="label">คำถาม<Field name="question" placeholder="คืนนี้กินอะไรดี" maxLength={120} required autoFocus/></label>
        <fieldset className="label">
          <legend className="mb-[5px]">ตัวเลือก</legend>
          <div className="grid gap-2">{Array.from({ length: rows }, (_, i) => <Field key={i} name="option" placeholder={`ตัวเลือกที่ ${i + 1}`} maxLength={60} required={i < MIN_OPTIONS} aria-label={`ตัวเลือกที่ ${i + 1}`}/>)}</div>
          {rows < MAX_OPTIONS && <button type="button" onClick={() => setRows((n) => n + 1)} className="tap mt-2 inline-flex items-center gap-1.5 rounded-xl px-2 text-[.9rem] font-medium text-[var(--muted)]"><Plus size={18}/>เพิ่มตัวเลือก</button>}
        </fieldset>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <button type="button" onClick={close} className="tap rounded-xl border border-[var(--line)] font-medium">ยกเลิก</button>
          <button disabled={busy} className="tap rounded-xl bg-[var(--ink)] font-medium text-[var(--on-dark)] disabled:opacity-40">{busy ? "กำลังตั้ง…" : "เปิดโหวต"}</button>
        </div>
      </form>
    </div>
  </div>;
}
