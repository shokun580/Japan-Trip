"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, MapPinned, Settings, Vote } from "lucide-react";
import { useEffect, useState } from "react";
import { useUnreadChangelog } from "@/lib/changelog-seen";
import { waitingPolls } from "@/app/vote/actions";

// Five doors, one tap from anywhere: home, the full plan, the hotel (raised in the
// middle, the one most needed when lost), polls (with the wheel a tab away there),
// settings.
export function BottomNav({ mapUrl, name, canManage }: { mapUrl: string | null; name?: string; canManage: boolean }) {
  const pathname = usePathname();
  const at = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const unread = useUnreadChangelog();
  // Polls waiting for this person's vote, asked for on every page the bar is on,
  // and again whenever the app comes back to the front.
  const [waiting, setWaiting] = useState(0);
  useEffect(() => {
    let current = true;
    const ask = () => { if (document.visibilityState === "visible") void waitingPolls().then((n) => { if (current) setWaiting(n); }).catch(() => {}); };
    ask();
    document.addEventListener("visibilitychange", ask);
    return () => { current = false; document.removeEventListener("visibilitychange", ask); };
  }, [pathname]);

  return <nav aria-label="เมนูหลัก" className="nav-bar">
    <Link href="/" className="nav-item tap" aria-current={pathname === "/" ? "page" : undefined}><House size={22}/><span>หน้าหลัก</span></Link>
    <Link href="/plan" className="nav-item tap" aria-current={at("/plan") ? "page" : undefined}><CalendarDays size={22}/><span>แผนเที่ยว</span></Link>
    {mapUrl
      ? <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="nav-stay tap" aria-label={`เปิดแผนที่${name ? ` ${name}` : "ที่พัก"}`}><span className="nav-stay-button"><MapPinned size={24}/></span><span>ที่พัก</span></a>
      : canManage
        ? <Link href="/manage/stay" className="nav-stay tap" data-empty="true"><span className="nav-stay-button"><MapPinned size={24}/></span><span>ตั้งค่าที่พัก</span></Link>
        : <span className="nav-stay tap" data-empty="true" aria-disabled="true"><span className="nav-stay-button"><MapPinned size={24}/></span><span>ที่พัก</span></span>}
    <Link href="/vote" className="nav-item tap" aria-current={at("/vote") || at("/wheel") ? "page" : undefined}><span className="relative"><Vote size={22}/>{waiting > 0 && <span className="unread-dot" aria-label={`${waiting} โหวตรอคุณอยู่`}/>}</span><span>โหวต</span></Link>
    <Link href="/settings" className="nav-item tap" aria-current={at("/settings") || at("/manage") ? "page" : undefined}><span className="relative"><Settings size={22}/>{unread && <span className="unread-dot" aria-label="มีเวอร์ชันใหม่ที่ยังไม่ได้อ่าน"/>}</span><span>ตั้งค่า</span></Link>
  </nav>;
}
