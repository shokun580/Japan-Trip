"use client";
import { isPerson, type PersonKey } from "./people";

// The phone is the whole of the checklist's "session": no login, no cookie. Both the
// home-screen card and the checklist page read it, so it lives behind a tiny store
// they can subscribe to instead of each one reaching into localStorage in an effect.
const PERSON_KEY = "japan-trip.checklist.person";
const openKey = (person: string) => `japan-trip.checklist.open.${person}`;
const listeners = new Set<() => void>();

// Private mode, or a browser with site data blocked, throws on every access. The
// checklist still works there — it simply forgets who you are on the next visit.
function read(key: string) { try { return window.localStorage.getItem(key); } catch { return null; } }
function write(key: string, value: string | null) {
  try { if (value === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, value); } catch { /* nothing to remember it with */ }
}

export function subscribePerson(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => { listeners.delete(onChange); window.removeEventListener("storage", onChange); };
}

export function currentPerson(): PersonKey | null { const value = read(PERSON_KEY); return isPerson(value) ? value : null; }
export const noPerson = () => null;

export function rememberPerson(person: PersonKey | null) {
  write(PERSON_KEY, person);
  for (const listener of listeners) listener();
}

export function readOpenCategories(person: string): string[] {
  try { const stored = read(openKey(person)); return stored ? (JSON.parse(stored) as string[]) : []; } catch { return []; }
}
export function writeOpenCategories(person: string, ids: string[]) { write(openKey(person), JSON.stringify(ids)); }

// Server and client snapshots differ on purpose, which is exactly how a component
// can tell hydration is over without setting state from an effect.
export const subscribeNothing = () => () => {};
export const hydrated = () => true;
export const notHydrated = () => false;
