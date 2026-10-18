"use client";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { OWNER, people, type PersonKey } from "@/lib/people";

// Each tile is a submit button carrying its own key, so picking works before the
// page has hydrated. Once a tap is on its way every tile locks, and the one tapped
// stays lit, because the round trip to set the cookie is the only wait here.
// The owner's tile is the exception: it opens the PIN pad and never submits.
export function PersonPicker({ current, next }: { current: PersonKey | null; next: string }) {
  const router = useRouter();
  const { pending, data } = useFormStatus();
  const [entering, setEntering] = useState(false);
  const chosen = entering ? OWNER : pending ? data?.get("person") : null;

  function enterAsOwner() {
    // Already holding a signed cookie: this is just going back, not a new sign-in.
    if (current === OWNER) { setEntering(true); window.location.assign(next); return; }
    router.push(next === "/" ? "/login/pin" : `/login/pin?next=${encodeURIComponent(next)}`);
  }

  return <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-9 sm:grid-cols-4">
    {people.map((p, index) => <button
      key={p.key}
      type={p.key === OWNER ? "button" : "submit"}
      onClick={p.key === OWNER ? enterAsOwner : undefined}
      name={p.key === OWNER ? undefined : "person"}
      value={p.key === OWNER ? undefined : p.key}
      disabled={pending || entering}
      aria-current={p.key === current ? "true" : undefined}
      data-chosen={chosen === p.key}
      className={`person-tile ${index === people.length - 1 && people.length % 2 ? "col-span-2 sm:col-span-1" : ""}`}
    >
      <span className="person-badge" data-tone={p.tone} aria-hidden>{p.short}</span>
      <span className="min-w-0 truncate text-[1.02rem] font-semibold">{p.name}</span>
      {p.key === current
        ? <span className="-mt-1.5 text-[.75rem] text-[var(--muted)]">ใช้อยู่ตอนนี้</span>
        : p.key === OWNER && <span className="-mt-1.5 flex items-center gap-1 text-[.75rem] text-[var(--muted)]"><Lock size={12} aria-hidden />ใช้ PIN</span>}
    </button>)}
  </div>;
}
