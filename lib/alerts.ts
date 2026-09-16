"use client";
import Swal from "sweetalert2";

// SweetAlert takes colours as strings, so the palette has to be repeated here.
// Keep these in step with the :root block in app/globals.css.
const ink = "#495867", slate = "#577399", snow = "#f7f7ff", accent = "#fe5f55";

const base = { buttonsStyling: true, confirmButtonColor: ink, cancelButtonColor: slate, background: snow, color: ink } as const;

const toast = Swal.mixin({ ...base, toast: true, position: "top", showConfirmButton: false, timer: 2400, timerProgressBar: true });

export const toastSuccess = (title: string) => toast.fire({ icon: "success", title });
export const alertError = (title: string) => Swal.fire({ ...base, icon: "error", title, confirmButtonText: "เข้าใจแล้ว" });

export async function confirmDelete(name: string) {
  const result = await Swal.fire({
    ...base,
    icon: "warning",
    title: "ต้องการลบกิจกรรมนี้?",
    text: name,
    showCancelButton: true,
    confirmButtonText: "ลบเลย",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: accent,
    reverseButtons: true,
  });
  return result.isConfirmed;
}

export async function promptText(title: string, value = "", placeholder = "") {
  const result = await Swal.fire({
    ...base,
    title,
    input: "text",
    inputValue: value,
    inputPlaceholder: placeholder,
    inputAttributes: { maxlength: "80", autocapitalize: "off" },
    showCancelButton: true,
    confirmButtonText: "บันทึก",
    cancelButtonText: "ยกเลิก",
    reverseButtons: true,
    inputValidator: (text) => (text.trim() ? undefined : "กรุณาใส่ชื่อ"),
  });
  return result.isConfirmed ? String(result.value).trim() : null;
}

export async function confirmAction(title: string, text: string, confirmButtonText: string) {
  const result = await Swal.fire({ ...base, icon: "warning", title, text, showCancelButton: true, confirmButtonText, cancelButtonText: "ยกเลิก", confirmButtonColor: accent, reverseButtons: true });
  return result.isConfirmed;
}

// One sheet instead of a floating popover menu: on a phone the buttons are easier
// to hit than a menu anchored to a row, and nothing has to be positioned by hand.
export async function chooseAction(title: string, confirmButtonText: string, denyButtonText: string, text?: string) {
  const result = await Swal.fire({ ...base, title, text, showCancelButton: true, showDenyButton: true, confirmButtonText, denyButtonText, cancelButtonText: "ปิด", denyButtonColor: accent });
  if (result.isConfirmed) return "confirm" as const;
  if (result.isDenied) return "deny" as const;
  return null;
}

export async function rowAction(title: string) {
  const choice = await chooseAction(title, "เปลี่ยนชื่อ", "ลบ");
  return choice === "confirm" ? "rename" as const : choice === "deny" ? "delete" as const : null;
}
