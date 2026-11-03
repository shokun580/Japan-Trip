import { db } from "./db";
import { themeOf, type Theme } from "./themes";

// The person's saved theme, for the root layout to draw on the server. Null when
// they have not chosen one (or there is no database), and the phone's copy is used.
export async function getSavedTheme(person: string | null): Promise<Theme | null> {
  if (!person || !process.env.DATABASE_URL) return null;
  try {
    const row = await db.preferences.findUnique({ where: { person }, select: { theme: true } });
    return row?.theme ? themeOf(row.theme) : null;
  } catch { return null; }
}
