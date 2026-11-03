import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StartAtTop } from "@/components/start-at-top";
import { Offline } from "@/components/offline";
import { currentPerson } from "@/lib/session";
import { themeBootScript } from "@/lib/themes";

// appleWebApp makes a home-screen copy open full screen on iOS, under the short name
// that fits beneath the icon. The rest of the install comes from app/manifest.ts.
export const metadata: Metadata = { title: "Japan Trip 2026", description: "แผนเที่ยวญี่ปุ่นสำหรับทุกคนในทริป", appleWebApp: { capable: true, title: "Japan Trip" } };
// viewportFit "cover" lets the page background paint behind the status bar, so there is
// no seam between it and the gradient. The safe-area insets in globals.css then keep
// content clear of the Dynamic Island.
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#bdd5ea", viewportFit: "cover" };
// suppressHydrationWarning: the theme script below writes colours onto <html> before
// React runs, and that is expected rather than a mismatch.
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const person = await currentPerson();
  return <html lang="th" suppressHydrationWarning>
    <body>
      <script dangerouslySetInnerHTML={{ __html: themeBootScript(person) }} />
      <StartAtTop />
      <Offline />
      {children}
    </body>
  </html>;
}
