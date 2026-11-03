"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Disc3, House, MapPinned, Settings, Vote } from "lucide-react";
import { openDialog } from "./dialog-host";

// Five doors, one tap from anywhere: home, the full plan, the hotel (raised in the
// middle, the one most needed when lost), polls and the wheel together, settings.
export function BottomNav({ mapUrl, name, canManage }: { mapUrl: string | null; name?: string; canManage: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const at = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Polls and the wheel share a slot: the tap asks which, in the app's own sheet.
  const decide = async () => {
    const { value } = await openDialog({
      title: "ตัดสินใจด้วยกัน", dismiss: null,
      buttons: [{ label: "โหวต", value: "vote", tone: "primary" }, { label: "วงล้อตัดสินใจ", value: "wheel", tone: "plain" }, { label: "ปิด", value: "close", tone: "plain" }],
    });
    if (value === "vote") router.push("/vote");
    if (value === "wheel") router.push("/wheel");
  };

  return <nav aria-label="เมนูหลัก" className="nav-bar">
    <Link href="/" className="nav-item tap" aria-current={pathname === "/" ? "page" : undefined}><House size={22}/><span>หน้าหลัก</span></Link>
    <Link href="/plan" className="nav-item tap" aria-current={at("/plan") ? "page" : undefined}><CalendarDays size={22}/><span>แผนเที่ยว</span></Link>
    {mapUrl
      ? <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="nav-stay tap" aria-label={`เปิดแผนที่${name ? ` ${name}` : "ที่พัก"}`}><span className="nav-stay-button"><MapPinned size={24}/></span><span>ที่พัก</span></a>
      : canManage
        ? <Link href="/manage/stay" className="nav-stay tap" data-empty="true"><span className="nav-stay-button"><MapPinned size={24}/></span><span>ตั้งค่าที่พัก</span></Link>
        : <span className="nav-stay tap" data-empty="true" aria-disabled="true"><span className="nav-stay-button"><MapPinned size={24}/></span><span>ที่พัก</span></span>}
    <button type="button" onClick={decide} className="nav-item tap" aria-current={at("/vote") || at("/wheel") ? "page" : undefined}><span className="relative"><Vote size={22}/><Disc3 size={12} className="absolute -right-2 -bottom-1" aria-hidden/></span><span>โหวต</span></button>
    <Link href="/settings" className="nav-item tap" aria-current={at("/settings") || at("/manage") ? "page" : undefined}><Settings size={22}/><span>ตั้งค่า</span></Link>
  </nav>;
}
