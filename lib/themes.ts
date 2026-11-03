// Colour themes. Each one fills the five palette roles of globals.css plus the page
// background and `deep`, the colour shadows and the dialog scrim are mixed from. In a
// dark theme the roles invert: `ink` is the light text and `snow` the dark card, so
// text on an ink button (on-dark = snow) stays readable without any other change.
// A theme is a per-phone, per-person choice kept in localStorage; nothing about it
// reaches the server.
export type Theme = { key: string; name: string; note: string; dark?: boolean; ink: string; slate: string; sky: string; snow: string; accent: string; paper: string; deep: string };

export const themes: Theme[] = [
  { key: "osaka-sky", name: "ฟ้าโอซาก้า", note: "สีเดิมของแอป", ink: "#495867", slate: "#577399", sky: "#bdd5ea", snow: "#f7f7ff", accent: "#fe5f55", paper: "#bdd5ea", deep: "#495867" },
  { key: "sakura", name: "ซากุระ", note: "ชมพูอ่อน สว่าง นุ่มตา", ink: "#5b3a4a", slate: "#a06b85", sky: "#f6d3dc", snow: "#fffafb", accent: "#e4577d", paper: "#fbe9ee", deep: "#5b3a4a" },
  { key: "matcha", name: "มัทฉะ", note: "เขียวชา สว่าง สบายตา", ink: "#2f4a3a", slate: "#6b8f7a", sky: "#cfe3cf", snow: "#f9fcf8", accent: "#d9823b", paper: "#e6efe3", deep: "#2f4a3a" },
  { key: "washi", name: "กระดาษวาชิ", note: "ครีมอุ่น สว่าง เหมือนกระดาษ", ink: "#4a3f35", slate: "#8c7b6b", sky: "#ead9c2", snow: "#fdf9f3", accent: "#c8553d", paper: "#f1e7d8", deep: "#4a3f35" },
  { key: "aizome", name: "ครามไอโซเมะ", note: "น้ำเงินคราม สว่าง", ink: "#22305e", slate: "#5b6a9e", sky: "#d7deef", snow: "#fbfbff", accent: "#e2503f", paper: "#e8ecf6", deep: "#22305e" },
  { key: "tokyo-night", name: "ราตรีโตเกียว", note: "มืด น้ำเงินเข้ม ตัวหนังสือสว่าง", dark: true, ink: "#e6ecf7", slate: "#93a0bb", sky: "#2b3650", snow: "#171c28", accent: "#ff6b6b", paper: "#0f131c", deep: "#000000" },
  { key: "sumi", name: "หมึกซุมิ", note: "มืด เทาดำล้วน", dark: true, ink: "#ececec", slate: "#9a9a9a", sky: "#2e2e2e", snow: "#1b1b1b", accent: "#f4a261", paper: "#111111", deep: "#000000" },
  { key: "bamboo-night", name: "ป่าไผ่ยามค่ำ", note: "มืด เขียวเข้ม แต้มทอง", dark: true, ink: "#e3eee5", slate: "#8fae98", sky: "#233b2c", snow: "#141f18", accent: "#ffd166", paper: "#0c130f", deep: "#000000" },
  { key: "neon-osaka", name: "นีออนโอซาก้า", note: "มืด ม่วงเข้ม ชมพูนีออน", dark: true, ink: "#efe6ff", slate: "#a79bc9", sky: "#342b54", snow: "#1b1630", accent: "#ff4fa3", paper: "#110d20", deep: "#000000" },
];

export const DEFAULT_THEME = themes[0];
export const themeOf = (key: string | null | undefined) => themes.find((t) => t.key === key) ?? DEFAULT_THEME;

// The CSS for <html> when the server already knows the person's theme, so the
// first paint is in their colours on any phone, before any script runs.
export function themeStyle(theme: Theme): Record<string, string> {
  return { ...Object.fromEntries(ROLE_LIST.map((role) => [`--${role}`, theme[role]])), colorScheme: theme.dark ? "dark" : "light" };
}

// One key per person on this phone, so two people sharing it each keep their own.
// It is a copy of the choice saved in the database, for the moments the database
// cannot answer: offline, or before a choice was ever saved.
export const themeStorageKey = (person: string) => `japan-trip.theme.${person}`;

export function readThemeKey(person: string) {
  try { return window.localStorage.getItem(themeStorageKey(person)); } catch { return null; }
}
export function writeThemeKey(person: string, key: string) {
  try { window.localStorage.setItem(themeStorageKey(person), key); } catch { /* nothing to remember it with */ }
}

const ROLES = ["ink", "slate", "sky", "snow", "accent", "paper", "deep"] as const;
const ROLE_LIST = ROLES;

// Writes the roles straight onto <html>, where the :root values of globals.css are
// overridden; the status bar follows the page background through theme-color.
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  for (const role of ROLES) root.style.setProperty(`--${role}`, theme[role]);
  root.dataset.theme = theme.key;
  root.style.colorScheme = theme.dark ? "dark" : "light";
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", theme.paper);
}

// The same, as a script the layout inlines before anything paints, so a themed
// phone never flashes the default colours on load. Kept in step with applyTheme.
// When the server has already drawn the saved theme (data-theme on <html>), that
// wins and is copied to the phone; otherwise the phone's own copy is used.
export function themeBootScript(person: string | null) {
  const table = JSON.stringify(themes.map((t) => [t.key, t.dark ? 1 : 0, ...ROLES.map((r) => t[r])]));
  const key = JSON.stringify(themeStorageKey(person ?? ""));
  return `(function(){try{var s=document.documentElement.dataset.theme;if(s){localStorage.setItem(${key},s);return;}var k=localStorage.getItem(${key});if(!k)return;var t=${table}.find(function(x){return x[0]===k});if(!t)return;var r=document.documentElement,n=${JSON.stringify(ROLES)};for(var i=0;i<n.length;i++)r.style.setProperty("--"+n[i],t[i+2]);r.dataset.theme=k;r.style.colorScheme=t[1]?"dark":"light";var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t[7]);}catch(e){}})()`;
}
