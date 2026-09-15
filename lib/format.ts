export const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
export function shortThaiDate(iso: string) { const [y, m, d] = iso.split("-").map(Number); return `${d} ${thaiMonths[m - 1]} ${y + 543}`; }
export function dayLabel(iso: string) { const [, m, d] = iso.split("-").map(Number); return `${d} ${thaiMonths[m - 1]}`; }
