"use client";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { applyTheme, DEFAULT_THEME, readThemeKey, themeOf, themes, writeThemeKey, type Theme } from "@/lib/themes";
import { saveTheme } from "@/app/settings/actions";
import { alertError } from "@/lib/alerts";
import { reach } from "@/lib/reach";

// Picks the app's colours for this person. A tap applies the theme at once, so the
// sheet itself is the preview; the choice is saved to their account (every phone
// they use) and kept on this phone too, for when there is no signal.
export function ThemePicker({ person, open, onClose }: { person: string; open: boolean; onClose: () => void }) {
  // Read from storage rather than the page, so it is right for this person even
  // before the effect below has repainted after a switch of person.
  const [current, setCurrent] = useState(() => (typeof window === "undefined" ? DEFAULT_THEME.key : themeOf(readThemeKey(person)).key));
  const [closing, setClosing] = useState(false);

  // The layout's inline script has already painted the stored theme on a full load;
  // this covers arriving here by client navigation after picking another name.
  useEffect(() => { applyTheme(themeOf(readThemeKey(person))); }, [person]);

  const choose = async (theme: Theme) => {
    setCurrent(theme.key); applyTheme(theme); writeThemeKey(person, theme.key);
    const result = await reach(saveTheme(theme.key));
    if (!result.ok) alertError(`เปลี่ยนสีในเครื่องนี้แล้ว แต่ยังบันทึกไม่ได้: ${result.message}`);
  };
  // Same exit as the other sheets; the length matches sheet-out in globals.css.
  const close = () => { setClosing(true); window.setTimeout(() => { setClosing(false); onClose(); }, 160); };

  if (!open) return null;
  return <div className="overlay fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/55 p-4 sm:p-5" data-closing={closing} role="dialog" aria-modal="true" aria-labelledby="theme-title">
    <div className="sheet max-h-[92dvh] w-full max-w-lg overflow-auto rounded-[28px] bg-[var(--card)] px-5 pb-5 shadow-2xl sm:px-7 sm:pb-7">
      {/* The title, the close button and what a choice does stay in view while the
          list scrolls under them. */}
      <div className="sheet-head -mx-5 px-5 pt-5 pb-3 sm:-mx-7 sm:px-7 sm:pt-7">
        <div className="flex items-center justify-between">
          <h2 id="theme-title" className="text-2xl font-bold">ธีมสี</h2>
          <button onClick={close} className="tap grid place-items-center rounded-full" aria-label="ปิด"><X/></button>
        </div>
        <p className="mt-1 text-[.95rem] text-[var(--muted)]">บันทึกไว้กับชื่อคุณ เข้าเครื่องไหนก็เป็นสีนี้ คนอื่นยังเห็นสีของตัวเอง</p>
      </div>
      <ul className="mt-3 grid gap-2.5">{themes.map((theme) => {
        const chosen = theme.key === current;
        return <li key={theme.key}>
          <button type="button" onClick={() => void choose(theme)} aria-pressed={chosen} className="theme-tile tap w-full">
            <span className="theme-swatch" aria-hidden>{[theme.ink, theme.slate, theme.sky, theme.accent, theme.paper].map((c, i) => <span key={i} style={{ background: c }}/>)}</span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate font-medium">{theme.name}</span>
              <span className="block truncate text-[.8rem] text-[var(--muted)]">{theme.note}</span>
            </span>
            <span className="theme-tick" data-on={chosen}><Check size={16} strokeWidth={3}/></span>
          </button>
        </li>;
      })}</ul>
    </div>
  </div>;
}
