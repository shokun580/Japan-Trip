"use client";
import Link from "next/link";
import { ArrowUpDown, Check, ChevronDown, ChevronLeft, ChevronsDownUp, ChevronsUpDown, MoreVertical, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { personName, personOf, type PersonKey } from "@/lib/people";
import { alertError, chooseAction, confirmAction, promptText, rowAction } from "@/lib/alerts";
import type { PackingCategoryData, PackingItemData } from "@/lib/types";
import { readLastChecklist, readOpenCategories, writeLastChecklist, writeOpenCategories } from "@/lib/checklist-store";
import { addCategory, addItem, clearChecks, loadChecklist, removeCategory, removeItem, renameCategory, renameItem, reorderCategories, reorderItems, resetChecklist, setItemChecked } from "@/app/checklist/actions";
import { Field } from "./field";
import { BottomNav } from "./bottom-nav";
import type { NavData } from "@/lib/nav";
import { reach } from "@/lib/reach";
import { useDragSwap } from "@/lib/use-drag-swap";

const countOf = (categories: PackingCategoryData[]) => {
  const items = categories.flatMap((c) => c.items);
  return { done: items.filter((i) => i.checked).length, total: items.length };
};

// The drag hook reports which row was dropped on which. A checklist moves the row into
// that place rather than swapping the two, so everything in between shifts by one.
function moved<T extends { id: string }>(list: T[], from: string, to: string) {
  const i = list.findIndex((x) => x.id === from), j = list.findIndex((x) => x.id === to);
  if (i < 0 || j < 0) return list;
  const next = [...list];
  next.splice(j, 0, ...next.splice(i, 1));
  return next;
}

export function ChecklistApp({ person, nav }: { person: PersonKey; nav: NavData }) {
  // Keyed by person so switching shows the loader instead of the previous list.
  const [loaded, setLoaded] = useState<{ person: string; categories: PackingCategoryData[]; saved: boolean } | null>(null);
  const [failure, setFailure] = useState<{ person: string; message: string } | null>(null);
  const [open, setOpen] = useState<string[]>([]);
  const [adding, setAdding] = useState<string | null>(null);

  const categories = loaded?.person === person ? loaded.categories : null;
  const error = failure?.person === person ? failure.message : null;

  // The list is fetched in the effect's own callback rather than through a helper
  // so nothing sets state before the request resolves, and `attempt` is what the
  // retry button bumps to run it again.
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    loadChecklist(person)
      .then((result) => {
        if (!current) return;
        if (!result.ok) { setFailure({ person, message: result.message }); return; }
        setFailure(null);
        setLoaded({ person, categories: result.categories, saved: result.saved });
        setOpen(readOpenCategories(person));
        writeLastChecklist(person, result.categories);
      })
      .catch(() => {
        if (!current) return;
        // No connection: the list from the last visit still shows, read-only in effect
        // since every edit needs the server and will be rolled back.
        const last = readLastChecklist(person);
        if (last) { setFailure(null); setLoaded({ person, categories: last, saved: true }); setOpen(readOpenCategories(person)); }
        else setFailure({ person, message: "เชื่อมต่อไม่สำเร็จ" });
      });
    return () => { current = false; };
  }, [person, attempt]);

  const setCategories = useCallback((next: PackingCategoryData[]) => setLoaded((prev) => (prev ? { ...prev, categories: next } : prev)), []);

  function toggleOpen(id: string) {
    setOpen((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeOpenCategories(person, next);
      return next;
    });
  }

  function setAllOpen(ids: string[]) {
    setOpen(ids);
    writeOpenCategories(person, ids);
  }

  // Every edit lands in state first and is rolled back if the server says no, so a
  // checkbox feels instant instead of waiting on a round trip.
  async function commit(next: PackingCategoryData[], work: () => Promise<{ ok: true } | { ok: false; message: string } | { ok: true; id: string }>, after?: (id: string) => void) {
    const before = categories ?? [];
    setCategories(next);
    const result = await reach(work());
    if (!result.ok) { setCategories(before); alertError(result.message); return; }
    if (after && "id" in result) after(result.id);
  }

  const mapCategory = (id: string, fn: (category: PackingCategoryData) => PackingCategoryData) =>
    (categories ?? []).map((c) => (c.id === id ? fn(c) : c));

  async function toggleItem(category: PackingCategoryData, item: PackingItemData) {
    const checked = !item.checked;
    await commit(mapCategory(category.id, (c) => ({ ...c, items: c.items.map((i) => (i.id === item.id ? { ...i, checked } : i)) })), () => setItemChecked(item.id, checked));
  }

  async function createItem(category: PackingCategoryData, name: string) {
    const temporary = `tmp-${Date.now()}`;
    await commit(
      mapCategory(category.id, (c) => ({ ...c, items: [...c.items, { id: temporary, name, checked: false }] })),
      () => addItem(category.id, name),
      (id) => setLoaded((prev) => (prev ? { ...prev, categories: prev.categories.map((c) => (c.id === category.id ? { ...c, items: c.items.map((i) => (i.id === temporary ? { ...i, id } : i)) } : c)) } : prev)),
    );
  }

  async function editItem(category: PackingCategoryData, item: PackingItemData) {
    const choice = await rowAction(item.name);
    if (choice === "rename") {
      const name = await promptText("เปลี่ยนชื่อรายการ", item.name);
      if (!name || name === item.name) return;
      await commit(mapCategory(category.id, (c) => ({ ...c, items: c.items.map((i) => (i.id === item.id ? { ...i, name } : i)) })), () => renameItem(item.id, name));
    }
    if (choice === "delete") {
      if (!(await confirmAction("ลบรายการนี้?", item.name, "ลบเลย"))) return;
      await commit(mapCategory(category.id, (c) => ({ ...c, items: c.items.filter((i) => i.id !== item.id) })), () => removeItem(item.id));
    }
  }

  async function moveItem(category: PackingCategoryData, from: string, to: string) {
    const items = moved(category.items, from, to);
    await commit(mapCategory(category.id, (c) => ({ ...c, items })), () => reorderItems(category.id, items.map((i) => i.id)));
  }

  async function moveCategory(from: string, to: string) {
    const next = moved(categories ?? [], from, to);
    await commit(next, () => reorderCategories(person, next.map((c) => c.id)));
  }

  async function createCategory() {
    const name = await promptText("หมวดหมู่ใหม่", "", "เช่น ของฝาก");
    if (!name) return;
    const temporary = `tmp-${Date.now()}`;
    await commit(
      [...(categories ?? []), { id: temporary, name, items: [] }],
      () => addCategory(person, name),
      (id) => { setLoaded((prev) => (prev ? { ...prev, categories: prev.categories.map((c) => (c.id === temporary ? { ...c, id } : c)) } : prev)); setOpen((prev) => [...prev, id]); },
    );
  }

  async function editCategory(category: PackingCategoryData) {
    const choice = await rowAction(category.name);
    if (choice === "rename") {
      const name = await promptText("เปลี่ยนชื่อหมวดหมู่", category.name);
      if (!name || name === category.name) return;
      await commit(mapCategory(category.id, (c) => ({ ...c, name })), () => renameCategory(category.id, name));
    }
    if (choice === "delete") {
      if (!(await confirmAction("ลบทั้งหมวดหมู่?", `${category.name} และของ ${category.items.length} รายการข้างในจะหายไปด้วย`, "ลบเลย"))) return;
      await commit((categories ?? []).filter((c) => c.id !== category.id), () => removeCategory(category.id));
    }
  }

  // Both of these throw work away, so they stay behind the header menu rather than
  // sitting on screen where a thumb can find them by accident.
  async function openMenu() {
    const choice = await chooseAction("จัดการเช็คลิสต์", "ล้างที่ติ๊กไว้", "คืนค่าเริ่มต้น", "ทั้งสองอย่างย้อนกลับไม่ได้");
    if (choice === "confirm") {
      if (!(await confirmAction("ล้างเครื่องหมายทั้งหมด?", "รายการของยังอยู่ครบ แค่กลับไปเป็นยังไม่ได้เตรียม", "ล้างเลย"))) return;
      await commit((categories ?? []).map((c) => ({ ...c, items: c.items.map((i) => ({ ...i, checked: false })) })), () => clearChecks(person));
    }
    if (choice === "deny") {
      if (!(await confirmAction("คืนค่าลิสต์ตั้งต้น?", "หมวดหมู่และของที่เพิ่มเองทั้งหมดจะถูกลบ แล้วแทนที่ด้วยลิสต์เริ่มต้น", "คืนค่า"))) return;
      const result = await reach(resetChecklist(person));
      if (!result.ok) { alertError(result.message); return; }
      setCategories(result.categories); setAllOpen([]);
    }
  }

  const total = categories ? countOf(categories) : null;
  const saved = loaded?.person === person ? loaded.saved : true;
  const allOpen = Boolean(categories?.length) && open.length === categories?.length;

  return <main className="shell">
    <PageHeader onMenu={openMenu} />

    <div className="mt-5 flex items-center gap-3">
      <span className="person-badge person-badge-sm" data-tone={personOf(person)?.tone} aria-hidden>{personOf(person)?.short}</span>
      <div className="min-w-0 flex-1">
        <p className="eyebrow">เช็คลิสต์ของ</p>
        <h1 className="truncate text-[1.45rem] leading-tight font-bold tracking-tight">{personName(person)}</h1>
      </div>
      <Link href="/login?next=/checklist" className="tap grid shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 text-[.85rem] font-medium">เปลี่ยนคน</Link>
    </div>

    {!saved && <p className="mt-4 rounded-2xl border border-dashed border-[var(--line-strong)] p-3 text-[.85rem] text-[var(--muted)]">โหมดตัวอย่าง: ยังไม่ได้ต่อฐานข้อมูล สิ่งที่แก้จะไม่ถูกบันทึก</p>}

    {error && <div className="card mt-4 p-5">
      <p className="font-semibold">เปิดเช็คลิสต์ไม่สำเร็จ</p>
      <p className="mt-1 text-[.9rem] text-[var(--muted)]">{error}</p>
      <button onClick={() => setAttempt((n) => n + 1)} className="tap mt-3 rounded-xl bg-[var(--ink)] px-4 font-medium text-[var(--on-dark)]">ลองใหม่</button>
    </div>}

    {!categories && !error && <p className="mt-10 text-center text-[var(--muted)]">กำลังโหลด…</p>}

    {categories && total && <>
      <section className="card mt-4 p-4 sm:p-5" aria-label="ความคืบหน้า">
        <div className="flex items-end justify-between gap-3">
          <p className="text-[.95rem] font-medium">เตรียมแล้ว <span className="text-[1.3rem] font-bold">{total.done}</span> จาก {total.total} รายการ</p>
          <p className="text-[.85rem] font-semibold text-[var(--muted)]">{total.total ? Math.round((total.done / total.total) * 100) : 0}%</p>
        </div>
        <div className="meter mt-2.5"><span style={{ width: `${total.total ? (total.done / total.total) * 100 : 0}%` }} /></div>
      </section>

      {categories.length > 0 && <div className="mt-4 flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-1.5 text-[.85rem] text-[var(--muted)]"><ArrowUpDown size={15} className="shrink-0" />กดค้างแล้วลากเพื่อเลื่อนลำดับ</p>
        <button onClick={() => setAllOpen(allOpen ? [] : categories.map((c) => c.id))} className="flex shrink-0 items-center gap-1.5 rounded-lg px-1 py-1.5 text-[.85rem] font-medium text-[var(--muted)]">
          {allOpen ? <ChevronsDownUp size={17} /> : <ChevronsUpDown size={17} />}{allOpen ? "พับทั้งหมด" : "กางทั้งหมด"}
        </button>
      </div>}

      <DragList ids={categories.map((c) => c.id)} onMove={(from, to) => void moveCategory(from, to)} className="mt-2 space-y-3">{(groups) => categories.map((category) => {
        const count = countOf([category]);
        const expanded = open.includes(category.id);
        const lift = groups.row(category.id);
        // Only the header picks a category up: a press on one of its items belongs to
        // that item's own list.
        return <li key={category.id} {...lift} onPointerDown={(event) => { if ((event.target as Element).closest("[data-pack-head]")) lift.onPointerDown(event); }} className="card pack-card swap-row overflow-hidden" data-lifted={category.id === groups.lifted} data-over={category.id === groups.over}>
          <div data-pack-head className="flex items-stretch">
            <button {...groups.keys(category.id)} onClick={() => toggleOpen(category.id)} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center gap-3 p-4 text-left">
              <ChevronDown size={20} className={`shrink-0 text-[var(--muted)] transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{category.name}</span>
                {count.done > 0 && <span className="meter mt-1.5"><span style={{ width: `${(count.done / count.total) * 100}%` }} /></span>}
              </span>
              <span className="shrink-0 rounded-full bg-[var(--paper)] px-2.5 py-1 text-[.78rem] font-semibold text-[var(--ink)]">{count.done}/{count.total}</span>
            </button>
            <button onClick={() => void editCategory(category)} aria-label={`จัดการหมวด ${category.name}`} className="tap grid shrink-0 place-items-center px-1 text-[var(--muted)]"><MoreVertical size={19} /></button>
          </div>

          <div className="reveal" data-open={expanded}><div>
            <div className="border-t border-[var(--line)] px-2 pb-2">
              <DragList ids={category.items.map((i) => i.id)} onMove={(from, to) => void moveItem(category, from, to)}>{(rows) => category.items.map((item) => <li key={item.id} {...rows.row(item.id)} className="swap-row pack-row flex items-stretch" data-lifted={item.id === rows.lifted} data-over={item.id === rows.over}>
                <button {...rows.keys(item.id)} onClick={() => void toggleItem(category, item)} role="checkbox" aria-checked={item.checked} data-checked={item.checked} className="check-row tap flex min-w-0 flex-1 items-center gap-3 px-2 text-left">
                  <span className="check" data-checked={item.checked}><Check size={18} strokeWidth={3.5} /></span>
                  <span className="check-label min-w-0 flex-1 py-2 text-[.97rem] transition-colors">{item.name}</span>
                </button>
                <button onClick={() => void editItem(category, item)} aria-label={`จัดการ ${item.name}`} className="tap grid shrink-0 place-items-center px-1 text-[var(--muted)]"><MoreVertical size={17} /></button>
              </li>)}</DragList>

              {adding === category.id
                ? <AddRow placeholder="ชื่อของที่จะเพิ่ม" onCancel={() => setAdding(null)} onSubmit={(name) => { setAdding(null); void createItem(category, name); }} />
                : <button onClick={() => setAdding(category.id)} className="tap flex w-full items-center gap-2 px-2 text-[.92rem] font-medium text-[var(--muted)]"><Plus size={18} />เพิ่มของในหมวดนี้</button>}
            </div>
          </div></div>
        </li>;
      })}</DragList>

      <button onClick={() => void createCategory()} className="tap mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--line-strong)] text-[.95rem] font-medium text-[var(--muted)]"><Plus size={19} />เพิ่มหมวดหมู่</button>
    </>}
    <BottomNav {...nav}/>
  </main>;
}

function PageHeader({ onMenu }: { onMenu?: () => void }) {
  return <header className="flex items-center justify-between gap-3">
    <Link href="/" className="tap -ml-2 flex items-center gap-1 rounded-xl px-2 font-medium text-[var(--ink)]"><ChevronLeft size={22} />กลับ</Link>
    {onMenu && <button onClick={onMenu} aria-label="จัดการเช็คลิสต์" className="tap grid place-items-center rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-sm"><MoreVertical size={24} /></button>}
  </header>;
}

// useDragSwap only takes hold of a list that is on the page when it mounts, so each
// list that can be rearranged gets a component of its own that mounts with it.
type Drag = Omit<ReturnType<typeof useDragSwap>, "list">;
function DragList({ ids, onMove, className, children }: { ids: string[]; onMove: (from: string, to: string) => void; className?: string; children: (drag: Drag) => ReactNode }) {
  const { list, lifted, over, row, keys } = useDragSwap(ids.join(), onMove);
  return <ul ref={list} className={className}>{children({ lifted, over, row, keys })}</ul>;
}

function AddRow({ placeholder, onSubmit, onCancel }: { placeholder: string; onSubmit: (name: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState("");
  return <form className="flex items-center gap-2 px-2 py-1" onSubmit={(e) => { e.preventDefault(); const name = value.trim(); if (name) onSubmit(name); }}>
    <Field autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} maxLength={80} className="min-h-[42px] text-[.95rem]" wrapClassName="flex-1" aria-label={placeholder} />
    <button type="submit" className="tap grid w-12 place-items-center rounded-xl bg-[var(--ink)] text-[var(--on-dark)]" aria-label="เพิ่ม"><Plus size={20} /></button>
    <button type="button" onClick={onCancel} className="tap grid w-12 place-items-center rounded-xl border border-[var(--line)] text-[var(--muted)]" aria-label="ยกเลิก"><X size={20} /></button>
  </form>;
}
