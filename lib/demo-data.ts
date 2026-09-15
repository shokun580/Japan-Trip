import type { TripData } from "./types";

const labels = ["Osaka", "Osaka", "Kyoto", "Nara", "Kobe", "Osaka", "Osaka", "เดินทางกลับ"];
export const demoTrip: TripData = {
  id: "demo", name: "เที่ยวญี่ปุ่น 2026", startDate: "2026-11-11", endDate: "2026-11-18",
  outbound: { date: "2026-11-11", takeoffTime: "08:00", landingTime: "15:30" },
  inbound: { date: "2026-11-18", takeoffTime: "11:00", landingTime: "15:15" },
  accommodation: { name: "Apartment Hotel 11 Namba Minami 2", mapUrl: null },
  days: labels.map((title, index) => ({
    id: `demo-day-${index}`, date: `2026-11-${String(index + 11).padStart(2, "0")}`, title, sortOrder: index,
    activities: index === 2 ? [
      { id: "a1", time: "07:00", name: "ออกจากที่พัก", description: "เดินทางจาก Osaka ไป Kyoto", mapUrl: null, sortOrder: 0 },
      { id: "a2", time: "09:00", name: "Kiyomizu-dera", description: "เที่ยววัดน้ำใส แนะนำให้ไปช่วงเช้าเพื่อหลีกเลี่ยงคนเยอะ", mapUrl: null, sortOrder: 1 },
      { id: "a3", time: "11:00", name: "Sannenzaka", description: "เดินเล่นย่านเมืองเก่า", mapUrl: null, sortOrder: 2 },
    ] : [],
  })),
};
