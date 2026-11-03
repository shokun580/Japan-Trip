"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Disc3, Vote } from "lucide-react";

// Polls and the wheel are two faces of one place: this switch at the top of each
// takes you to the other, the way the manage pages switch between sections.
export function DecideTabs() {
  const pathname = usePathname();
  const tabs = [{ href: "/vote", label: "โหวต", Icon: Vote }, { href: "/wheel", label: "วงล้อ", Icon: Disc3 }];
  return <nav className="mt-4 grid grid-cols-2 gap-1 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-1" aria-label="โหวตหรือวงล้อ">
    {tabs.map(({ href, label, Icon }) => {
      const current = pathname === href;
      return <Link key={href} href={href} aria-current={current ? "page" : undefined} className={`tap flex items-center justify-center gap-2 rounded-xl text-[.95rem] font-medium transition-colors ${current ? "bg-[var(--ink)] text-[var(--on-dark)]" : "text-[var(--muted)]"}`}><Icon size={19}/>{label}</Link>;
    })}
  </nav>;
}
