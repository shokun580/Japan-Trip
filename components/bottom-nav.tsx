"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, House, MapPinned, Settings, Vote } from "lucide-react";
import { useEffect, useState } from "react";
import { useUnreadChangelog } from "@/lib/changelog-seen";
import { useGlassLens } from "@/lib/use-glass-lens";
import { waitingPolls } from "@/app/vote/actions";

// Five doors, one tap from anywhere: home, the full plan, the hotel (raised in the
// middle, the one most needed when lost), polls (with the wheel a tab away there),
// settings. One sheet of glass marks where you are, and can be dragged along the bar
// to go somewhere else (lib/use-glass-lens.ts).
const PAGES: Record<number, string> = { 0: "/", 1: "/plan", 3: "/vote", 4: "/settings" };

type NavProps = { mapUrl: string | null; name?: string; canManage: boolean };

// The bar last on screen, so a loading screen can go on showing it.
const last: { props: NavProps | null; waiting: number } = { props: null, waiting: 0 };
const remember = (props: NavProps) => { last.props = props; };
const rememberWaiting = (n: number) => { last.waiting = n; };

// For the loading screens between pages: without it the bar would blink out as soon
// as a tab was picked, and take the glass with it. Nothing the first time, when there
// is no bar yet to keep.
export function BottomNavHold() {
  const [props] = useState(last.props);
  return props && <BottomNav {...props} holding/>;
}

export function BottomNav({ mapUrl, name, canManage, holding = false }: NavProps & { holding?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const at = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const current = pathname === "/" ? 0 : at("/plan") ? 1 : at("/vote") || at("/wheel") ? 3 : at("/settings") || at("/manage") ? 4 : null;
  const { bar, lens, held, settled, lit, gestures } = useGlassLens(current, (slot) => router.push(PAGES[slot]));
  const tab = (slot: number) => ({ href: PAGES[slot], "data-slot": slot, "data-lit": lit === slot, "aria-current": slot === current ? ("page" as const) : undefined });
  const unread = useUnreadChangelog();
  // Polls waiting for this person's vote, asked for on every page the bar is on,
  // and again whenever the app comes back to the front.
  const [waiting, setWaiting] = useState(last.waiting);
  useEffect(() => { if (!holding) remember({ mapUrl, name, canManage }); }, [holding, mapUrl, name, canManage]);
  useEffect(() => {
    if (holding) return;
    let current = true;
    const ask = () => { if (document.visibilityState === "visible") void waitingPolls().then((n) => { rememberWaiting(n); if (current) setWaiting(n); }).catch(() => {}); };
    ask();
    document.addEventListener("visibilitychange", ask);
    return () => { current = false; document.removeEventListener("visibilitychange", ask); };
  }, [pathname, holding]);

  return <nav ref={bar} aria-label="เมนูหลัก" className="nav-bar" data-held={held} data-settled={settled} {...gestures}>
    <span className="nav-frost" aria-hidden/>
    <span ref={lens} className="nav-lens" data-hidden={lit === null} style={{ transform: `translateX(${(current ?? 0) * 100}%)` }} aria-hidden/>
    <Link className="nav-item tap" {...tab(0)}><House size={22}/><span>หน้าหลัก</span></Link>
    <Link className="nav-item tap" {...tab(1)}><CalendarDays size={22}/><span>แผนเที่ยว</span></Link>
    {mapUrl
      ? <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="nav-stay tap" aria-label={`เปิดแผนที่${name ? ` ${name}` : "ที่พัก"}`}><span className="nav-stay-button"><MapPinned size={24}/></span><span>ที่พัก</span></a>
      : canManage
        ? <Link href="/manage/stay" className="nav-stay tap" data-empty="true"><span className="nav-stay-button"><MapPinned size={24}/></span><span>ตั้งค่าที่พัก</span></Link>
        : <span className="nav-stay tap" data-empty="true" aria-disabled="true"><span className="nav-stay-button"><MapPinned size={24}/></span><span>ที่พัก</span></span>}
    <Link className="nav-item tap" {...tab(3)}><span className="relative"><Vote size={22}/>{waiting > 0 && <span className="unread-dot" aria-label={`${waiting} โหวตรอคุณอยู่`}/>}</span><span>โหวต</span></Link>
    <Link className="nav-item tap" {...tab(4)}><span className="relative"><Settings size={22}/>{unread && <span className="unread-dot" aria-label="มีเวอร์ชันใหม่ที่ยังไม่ได้อ่าน"/>}</span><span>ตั้งค่า</span></Link>
  </nav>;
}
