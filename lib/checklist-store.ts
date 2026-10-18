"use client";

// Which categories are folded open is a per-phone convenience, so it stays in
// localStorage rather than the database.
const openKey = (person: string) => `japan-trip.checklist.open.${person}`;

// Private mode, or a browser with site data blocked, throws on every access. The
// checklist still works there — it simply forgets what was open on the next visit.
function read(key: string) { try { return window.localStorage.getItem(key); } catch { return null; } }
function write(key: string, value: string) { try { window.localStorage.setItem(key, value); } catch { /* nothing to remember it with */ } }

export function readOpenCategories(person: string): string[] {
  try { const stored = read(openKey(person)); return stored ? (JSON.parse(stored) as string[]) : []; } catch { return []; }
}
export function writeOpenCategories(person: string, ids: string[]) { write(openKey(person), JSON.stringify(ids)); }
