"use client";
import { useEffect } from "react";
import { markChangelogRead } from "@/lib/changelog-seen";

// Opening the patch notes counts as reading them.
export function ChangelogRead() {
  useEffect(() => { markChangelogRead(); }, []);
  return null;
}
