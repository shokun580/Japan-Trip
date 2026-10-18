"use client";
import { useFormStatus } from "react-dom";
import { people, type PersonKey } from "@/lib/people";

// Each tile is a submit button carrying its own key, so picking works before the
// page has hydrated. Once a tap is on its way every tile locks, and the one tapped
// stays lit, because the round trip to set the cookie is the only wait here.
export function PersonPicker({ current }: { current: PersonKey | null }) {
  const { pending, data } = useFormStatus();
  const chosen = pending ? data?.get("person") : null;

  return <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-9 sm:grid-cols-4">
    {people.map((p, index) => <button
      key={p.key}
      name="person"
      value={p.key}
      disabled={pending}
      aria-current={p.key === current ? "true" : undefined}
      data-chosen={chosen === p.key}
      className={`person-tile ${index === people.length - 1 && people.length % 2 ? "col-span-2 sm:col-span-1" : ""}`}
    >
      <span className="person-badge" data-tone={p.tone} aria-hidden>{p.short}</span>
      <span className="min-w-0 truncate text-[1.02rem] font-semibold">{p.name}</span>
      {p.key === current && <span className="-mt-1.5 text-[.75rem] text-[var(--muted)]">ใช้อยู่ตอนนี้</span>}
    </button>)}
  </div>;
}
