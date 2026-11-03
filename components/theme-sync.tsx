"use client";
import { useEffect } from "react";
import { saveTheme } from "@/app/settings/actions";
import { readThemeKey, themes } from "@/lib/themes";
import { reach } from "@/lib/reach";

// A theme picked on this phone before themes were saved to the database lives only
// here. Once, quietly, it is saved to the person's account so their other phones
// pick it up too.
export function ThemeSync({ person, saved }: { person: string; saved: boolean }) {
  useEffect(() => {
    if (saved) return;
    const local = readThemeKey(person);
    if (local && themes.some((t) => t.key === local)) void reach(saveTheme(local));
  }, [person, saved]);
  return null;
}
