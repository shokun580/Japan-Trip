"use client";
import { openDialog, showToast } from "@/components/dialog-host";

// Every popup in the app goes through these. They draw with the app's own dialog and
// toast (components/dialog-host.tsx), so they share its palette, type and motion;
// each one resolves once the person answers.

export const toastSuccess = (title: string) => showToast(title);

export async function alertError(title: string) {
  await openDialog({ icon: "error", title, dismiss: "ok", buttons: [{ label: "เข้าใจแล้ว", value: "ok", tone: "primary" }] });
}

export async function confirmAction(title: string, text: string, confirmButtonText: string) {
  const { value } = await openDialog({
    icon: "warning", title, text, dismiss: null,
    buttons: [{ label: "ยกเลิก", value: "cancel", tone: "plain" }, { label: confirmButtonText, value: "confirm", tone: "danger" }],
  });
  return value === "confirm";
}

export const confirmDelete = (name: string) => confirmAction("ต้องการลบกิจกรรมนี้?", name, "ลบเลย");

export async function promptText(title: string, value = "", placeholder = "") {
  const result = await openDialog({
    title, dismiss: null,
    input: { value, placeholder, maxLength: 80, validate: (text) => (text.trim() ? undefined : "กรุณาใส่ชื่อ") },
    buttons: [{ label: "ยกเลิก", value: "cancel", tone: "plain" }, { label: "บันทึก", value: "save", tone: "primary", submit: true }],
  });
  return result.value === "save" ? result.text.trim() : null;
}

// One sheet instead of a floating popover menu: on a phone the buttons are easier
// to hit than a menu anchored to a row, and nothing has to be positioned by hand.
export async function chooseAction(title: string, confirmButtonText: string, denyButtonText: string, text?: string) {
  const { value } = await openDialog({
    title, text, dismiss: null,
    buttons: [
      { label: confirmButtonText, value: "confirm", tone: "primary" },
      { label: denyButtonText, value: "deny", tone: "danger" },
      { label: "ปิด", value: "close", tone: "plain" },
    ],
  });
  return value === "confirm" || value === "deny" ? value : null;
}

export async function rowAction(title: string) {
  const choice = await chooseAction(title, "เปลี่ยนชื่อ", "ลบ");
  return choice === "confirm" ? "rename" as const : choice === "deny" ? "delete" as const : null;
}
