"use client";
/* eslint-disable @next/next/no-img-element -- next/image's optimizer fetches without the visitor's cookie, which proxy.ts turns away; the photos are already shrunk anyway. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, ChevronLeft, ChevronRight, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import type { NoteData } from "@/lib/types";
import type { NavData } from "@/lib/nav";
import { OWNER, personName, personOf } from "@/lib/people";
import { deleteNote, saveNote } from "@/app/notes/actions";
import { alertError, confirmAction, toastSuccess } from "@/lib/alerts";
import { dayLabel, readTokyoNow } from "@/lib/format";
import { MAX_NOTE_IMAGES, MAX_NOTE_LENGTH, MAX_NOTE_TITLE, shrinkPhoto } from "@/lib/note-images";
import { reach } from "@/lib/reach";
import { useViewportLock } from "@/lib/use-viewport-lock";
import { BottomNav } from "./bottom-nav";
import { Field, TextArea } from "./field";

const thumbUrl = (id: string) => `/notes/image/${id}?thumb`;
const fullUrl = (id: string) => `/notes/image/${id}`;
// Built by hand so the server and the phone print the same thing.
const stamp = (iso: string) => { const { date, time } = readTokyoNow(new Date(iso)); return `${dayLabel(date)} ${time}`; };

export function NoteBoard({ person, notes, live, nav }: { person: string; notes: NoteData[]; live: boolean; nav: NavData }) {
  const router = useRouter();
  const [editing, setEditing] = useState<NoteData | "new" | null>(null);

  // Other people's notes arrive when the app comes back to the front.
  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") router.refresh(); };
    document.addEventListener("visibilitychange", tick);
    return () => document.removeEventListener("visibilitychange", tick);
  }, [router]);

  return <main className="shell">
    <header className="flex items-center justify-between gap-3">
      <Link href="/settings" className="tap -ml-2 flex items-center gap-1 rounded-xl px-2 font-medium text-[var(--ink)]"><ChevronLeft size={22}/>กลับ</Link>
      {live && <button onClick={() => setEditing("new")} className="tap inline-flex items-center gap-2 rounded-2xl bg-[var(--ink)] px-4 font-medium text-[var(--on-dark)]"><Plus size={20}/>เขียนโน้ต</button>}
    </header>

    <div className="mt-5">
      <h1 className="text-[1.45rem] leading-tight font-medium tracking-tight">โน้ต</h1>
      <p className="mt-1 text-[.92rem] text-[var(--muted)]">จดเรื่องไว้พร้อมเนื้อหาและรูปให้ทุกคนในทริปเห็น คนเขียนกับ{personName(OWNER)}เท่านั้นที่แก้หรือลบได้</p>
    </div>

    {!live && <p className="mt-4 rounded-2xl border border-dashed border-[var(--line-strong)] p-3 text-[.85rem] text-[var(--muted)]">โหมดตัวอย่าง: ยังไม่ได้ต่อฐานข้อมูล จึงยังเขียนโน้ตไม่ได้</p>}

    {live && notes.length === 0 && <div className="card mt-5 p-5 text-center">
      <p className="font-medium">ยังไม่มีโน้ต</p>
      <p className="mt-1 text-[.9rem] text-[var(--muted)]">รหัสจอง รูปตั๋ว รูปเมนูที่อยากลอง เก็บไว้ตรงนี้ได้เลย</p>
    </div>}

    <section className="mt-5 space-y-3" aria-label="โน้ตทั้งหมด">{notes.map((note) => <NoteCard key={note.id} note={note} mine={note.createdBy === person || person === OWNER} onEdit={() => setEditing(note)}/>)}</section>

    {editing && <NoteEditor note={editing === "new" ? null : editing} onClose={() => setEditing(null)}/>}
    <BottomNav {...nav}/>
  </main>;
}

function NoteCard({ note, mine, onEdit }: { note: NoteData; mine: boolean; onEdit: () => void }) {
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const author = personOf(note.createdBy);

  const remove = async () => {
    if (!(await confirmAction("ลบโน้ตนี้?", note.title || note.body.slice(0, 60) || `โน้ตรูปภาพ ${note.images.length} รูป`, "ลบเลย"))) return;
    setBusy(true); const result = await reach(deleteNote(note.id)); setBusy(false);
    if (result.ok) toastSuccess("ลบโน้ตแล้ว"); else alertError(result.message);
  };

  return <article className="card p-4">
    <div className="flex items-center gap-2.5">
      <span className="person-badge person-badge-xs" data-tone={author?.tone} aria-hidden>{author?.short}</span>
      <p className="min-w-0 flex-1 truncate text-[.85rem] text-[var(--muted)]"><span className="font-medium text-[var(--ink)]">{personName(note.createdBy)}</span> · {stamp(note.createdAt)}</p>
    </div>

    {(note.title || note.body) && <div className="mt-3 space-y-1">
      {note.title && <h2 className="text-[1.25rem] leading-snug font-medium [overflow-wrap:anywhere]">{note.title}</h2>}
      {note.body && <p className="leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{note.body}</p>}
    </div>}

    {note.images.length > 0 && <div className="note-grid mt-3" data-few={note.images.length < 3}>
      {note.images.map((id, i) => <button key={id} type="button" className="note-thumb" onClick={() => setViewing(i)} aria-label={`ดูรูปที่ ${i + 1}`}><img src={thumbUrl(id)} alt="" loading="lazy" decoding="async"/></button>)}
    </div>}

    {mine && <div className="mt-3 flex border-t border-[var(--line)] pt-1">
      <button type="button" onClick={onEdit} disabled={busy} className="tap -ml-1 inline-flex items-center gap-1.5 rounded-xl px-2 text-[.88rem] font-medium disabled:opacity-40"><Pencil size={17}/>แก้ไข</button>
      <button type="button" onClick={remove} disabled={busy} className="tap -mr-1 ml-auto inline-flex items-center gap-1.5 rounded-xl px-2 text-[.88rem] font-medium text-[var(--accent)] disabled:opacity-40"><Trash2 size={17}/>ลบ</button>
    </div>}

    {viewing !== null && <Viewer images={note.images} start={viewing} onClose={() => setViewing(null)}/>}
  </article>;
}

// Each photo fills the screen and a sideways swipe moves to the next; the arrows say
// that there is a next one, and are the only way there with a mouse. The zoom is the
// browser's own pinch, and a long press offers the usual Save to Photos.
function Viewer({ images, start, onClose }: { images: string[]; start: number; onClose: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(start);
  useViewportLock(true);
  // Before the first paint, so it opens on the photo that was tapped.
  useLayoutEffect(() => { if (track.current) track.current.scrollLeft = start * track.current.clientWidth; }, [start]);
  const step = (by: number) => track.current?.scrollBy({ left: by * track.current.clientWidth, behavior: "smooth" });

  return <div className="note-viewer fade-in" role="dialog" aria-modal="true" aria-label="ดูรูปในโน้ต">
    <div ref={track} className="note-viewer-track" onScroll={(event) => setAt(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))}>
      {images.map((id, i) => <div key={id} className="note-viewer-slide"><img src={fullUrl(id)} alt={`รูปที่ ${i + 1}`} loading="lazy"/></div>)}
    </div>
    {images.length > 1 && <p className="note-viewer-count">{at + 1} / {images.length}</p>}
    {at > 0 && <button type="button" onClick={() => step(-1)} className="note-viewer-arrow tap" data-side="prev" aria-label="รูปก่อนหน้า"><ChevronLeft/></button>}
    {at < images.length - 1 && <button type="button" onClick={() => step(1)} className="note-viewer-arrow tap" data-side="next" aria-label="รูปถัดไป"><ChevronRight/></button>}
    <button type="button" onClick={onClose} className="note-viewer-close tap" aria-label="ปิด"><X/></button>
  </div>;
}

type NewPhoto = Awaited<ReturnType<typeof shrinkPhoto>> & { preview: string };

function NoteEditor({ note, onClose }: { note: NoteData | null; onClose: () => void }) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [text, setText] = useState(note?.body ?? "");
  const [kept, setKept] = useState(note?.images ?? []);
  const [added, setAdded] = useState<NewPhoto[]>([]);
  // Photos still being shrunk: each holds a placeholder tile and holds back Save.
  const [working, setWorking] = useState(0);
  const [busy, setBusy] = useState(false);
  const [closing, setClosing] = useState(false);
  const [previews] = useState(() => new Set<string>());
  useViewportLock(true);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  // Same exit as the other sheets; the length matches sheet-out in globals.css.
  const close = () => { setClosing(true); window.setTimeout(onClose, 160); };
  const room = MAX_NOTE_IMAGES - kept.length - added.length - working;
  const empty = !title.trim() && !text.trim() && !kept.length && !added.length;

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.currentTarget.files ?? [])];
    // Emptied so that choosing the same photo again still counts as a change.
    event.currentTarget.value = "";
    if (!files.length) return;
    const chosen = files.slice(0, room);
    setWorking((n) => n + chosen.length);
    let failed = 0;
    // One at a time: several decoded camera photos at once can run a phone out of
    // memory, and iOS answers that by reloading the page.
    for (const file of chosen) {
      try {
        const photo = await shrinkPhoto(file);
        const preview = URL.createObjectURL(photo.thumb);
        previews.add(preview);
        setAdded((list) => [...list, { ...photo, preview }]);
      } catch { failed += 1; }
      setWorking((n) => n - 1);
    }
    if (failed) alertError(`อ่านรูปไม่ได้ ${failed} รูป ลองเลือกรูปอื่นแทน`);
    else if (files.length > chosen.length) alertError(`แนบได้ไม่เกิน ${MAX_NOTE_IMAGES} รูปต่อโน้ต จึงเพิ่มให้แค่ ${chosen.length} รูปแรก`);
  };

  const discard = (photo: NewPhoto) => {
    URL.revokeObjectURL(photo.preview);
    previews.delete(photo.preview);
    setAdded((list) => list.filter((item) => item !== photo));
  };

  const save = async () => {
    const form = new FormData();
    if (note) form.set("noteId", note.id);
    form.set("title", title);
    form.set("body", text);
    for (const id of kept) form.append("keep", id);
    for (const photo of added) { form.append("full", photo.full, "full.jpg"); form.append("thumb", photo.thumb, "thumb.jpg"); }
    setBusy(true); const result = await reach(saveNote(form)); setBusy(false);
    if (!result.ok) { alertError(result.message); return; }
    toastSuccess(note ? "บันทึกโน้ตแล้ว" : "เพิ่มโน้ตแล้ว");
    close();
  };

  const showTiles = kept.length + added.length + working > 0;

  // dialog-overlay, so it shrinks with the iOS keyboard: the title and the buttons
  // stay in sight and only the middle scrolls.
  return <div className="overlay dialog-overlay note-overlay" data-closing={closing} role="dialog" aria-modal="true" aria-labelledby="note-title">
    <form className="sheet note-sheet" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <div className="flex items-center justify-between px-5 pt-3 pb-1">
        <h2 id="note-title" className="text-[1.2rem] font-medium">{note ? "แก้ไขโน้ต" : "เขียนโน้ต"}</h2>
        <button type="button" onClick={close} className="tap -mr-3 grid place-items-center rounded-full" aria-label="ปิด"><X/></button>
      </div>

      <div className="note-sheet-body">
        <label className="label">เรื่อง<Field value={title} onChange={(event) => setTitle(event.target.value)} placeholder="เช่น รหัสจองโรงแรม" maxLength={MAX_NOTE_TITLE} autoFocus={!note}/></label>
        <label className="label">เนื้อหา<TextArea value={text} onChange={(event) => setText(event.target.value)} placeholder="รายละเอียดที่อยากจดไว้" rows={4} maxLength={MAX_NOTE_LENGTH} className="resize-none"/></label>

        <div className="label">
          <span>รูปภาพ <span className="text-[.8rem] text-[var(--muted)]">· {working > 0 ? "กำลังเตรียมรูป…" : `สูงสุด ${MAX_NOTE_IMAGES} รูป`}</span></span>
          {showTiles && <div className="note-grid">
            {kept.map((id) => <Tile key={id} onRemove={() => setKept((list) => list.filter((item) => item !== id))}><img src={thumbUrl(id)} alt=""/></Tile>)}
            {added.map((photo) => <Tile key={photo.preview} onRemove={() => discard(photo)}><img src={photo.preview} alt=""/></Tile>)}
            {Array.from({ length: working }, (_, i) => <span key={i} className="skeleton note-thumb" aria-hidden/>)}
          </div>}

          {/* Two doors on purpose: the first opens the library, the second goes straight
              to the camera. sr-only rather than hidden, so the keyboard can still reach them. */}
          <div className="grid grid-cols-2 gap-2">
            <label className="note-pick tap"><ImagePlus size={19}/>คลังรูป<input type="file" accept="image/*" multiple onChange={pick} disabled={room <= 0 || busy} className="sr-only"/></label>
            <label className="note-pick tap"><Camera size={19}/>ถ่ายรูป<input type="file" accept="image/*" capture="environment" onChange={pick} disabled={room <= 0 || busy} className="sr-only"/></label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-[var(--line)] px-5 pt-3 pb-4">
        <button type="button" onClick={close} className="tap rounded-xl border border-[var(--line)] font-medium">ยกเลิก</button>
        <button disabled={busy || working > 0 || empty} className="tap rounded-xl bg-[var(--ink)] font-medium text-[var(--on-dark)] disabled:opacity-40">{busy ? "กำลังบันทึก…" : "บันทึก"}</button>
      </div>
    </form>
  </div>;
}

function Tile({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
  return <div className="relative">
    <span className="note-thumb">{children}</span>
    <button type="button" onClick={onRemove} className="note-remove" aria-label="เอารูปนี้ออก"><span><X size={13} strokeWidth={3}/></span></button>
  </div>;
}
