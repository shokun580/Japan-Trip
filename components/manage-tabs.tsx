"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { CalendarRange, Hotel, ListChecks, PlaneTakeoff } from "lucide-react";

export const manageSections = [
  { href: "/manage/trip", label: "ตั้งค่าทริป", Icon: CalendarRange },
  { href: "/manage/stay", label: "ตั้งค่าที่พัก", Icon: Hotel },
  { href: "/manage/flight", label: "ตั้งค่าเที่ยวบิน", Icon: PlaneTakeoff },
  { href: "/manage/activities", label: "กิจกรรม", Icon: ListChecks },
];

export function ManageTabs() {
  const pathname = usePathname();
  const active = useRef<HTMLAnchorElement>(null);
  useEffect(() => { active.current?.scrollIntoView({ block: "nearest", inline: "center" }); }, [pathname]);

  return <nav className="slider mb-4 flex gap-2" aria-label="ส่วนการตั้งค่า">
    {manageSections.map(({ href, label, Icon }) => {
      const current = pathname === href;
      return <Link key={href} href={href} ref={current ? active : undefined} aria-current={current ? "page" : undefined} className={`tap flex shrink-0 items-center gap-2 rounded-xl border px-4 text-[.95rem] font-medium ${current ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--on-dark)]" : "border-[var(--line)] bg-[var(--card)]"}`}><Icon size={19}/>{label}</Link>;
    })}
  </nav>;
}
