import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StartAtTop } from "@/components/start-at-top";

export const metadata: Metadata = { title: "Japan Trip 2026", description: "แผนเที่ยวญี่ปุ่นสำหรับทุกคนในทริป" };
// viewportFit "cover" lets the page background paint behind the status bar, so there is
// no seam between it and the gradient. The safe-area insets in globals.css then keep
// content clear of the Dynamic Island.
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#bdd5ea", viewportFit: "cover" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="th"><body><StartAtTop />{children}</body></html>; }
