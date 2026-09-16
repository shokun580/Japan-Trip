import type { Metadata } from "next";
import { ChecklistApp } from "@/components/checklist-app";

export const metadata: Metadata = { title: "เช็คลิสต์ของใช้" };

// Everything here depends on which person the phone remembers, so the page itself
// holds no data — the client asks for that person's list once it has read it.
export default function ChecklistPage() { return <ChecklistApp />; }
