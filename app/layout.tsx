import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StartAtTop } from "@/components/start-at-top";

export const metadata: Metadata = { title: "เที่ยวญี่ปุ่น 2026", description: "แผนเที่ยวญี่ปุ่นสำหรับทุกคนในทริป" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#bdd5ea" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="th"><body><StartAtTop />{children}</body></html>; }
