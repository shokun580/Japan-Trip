import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StartAtTop } from "@/components/start-at-top";
import { Offline } from "@/components/offline";
import { ScrollGuard } from "@/components/scroll-guard";
import { currentPerson } from "@/lib/session";
import { themeBootScript, themeStyle } from "@/lib/themes";
import { getSavedTheme } from "@/lib/preferences";
import { ThemeSync } from "@/components/theme-sync";
import { ZoneSync } from "@/components/zone-sync";

// appleWebApp makes a home-screen copy open full screen on iOS, under the short name
// that fits beneath the icon. The rest of the install comes from app/manifest.ts.
export const metadata: Metadata = { title: "Japan Trip 2026", description: "แผนเที่ยวญี่ปุ่นสำหรับทุกคนในทริป", appleWebApp: { capable: true, title: "Japan Trip" } };
// viewportFit "cover" lets the page background paint behind the status bar, so there is
// no seam between it and the gradient. The safe-area insets in globals.css then keep
// content clear of the Dynamic Island.
// The status bar takes the page background of the person's saved theme.
export async function generateViewport(): Promise<Viewport> {
  const theme = await getSavedTheme(await currentPerson());
  return { width: "device-width", initialScale: 1, themeColor: theme?.paper ?? "#bdd5ea", viewportFit: "cover" };
}
// suppressHydrationWarning: the theme script below writes colours onto <html> before
// React runs, and that is expected rather than a mismatch.
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const person = await currentPerson();
  const theme = await getSavedTheme(person);
  return <html lang="th" suppressHydrationWarning data-theme={theme?.key} style={theme ? themeStyle(theme) : undefined}>
    <body>
      <script dangerouslySetInnerHTML={{ __html: themeBootScript(person) }} />
      <StartAtTop />
      <ScrollGuard />
      {person && <ThemeSync person={person} saved={Boolean(theme)} />}
      <ZoneSync />
      <Offline />
      {children}
    </body>
  </html>;
}
