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
