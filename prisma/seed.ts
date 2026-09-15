import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const date = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const NAMBA_MAP = "https://www.google.com/maps/place/Apartment+Hotel+11+Namba+Minami+2/@34.6552895,135.4940263,17z/data=!4m9!3m8!1s0x6000e7c77b826173:0xe59291cfc6a12e24!5m2!4m1!1i2!8m2!3d34.6552895!4d135.4966066!16s%2Fg%2F11ym0tpyx9?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D";

type Activity = { time: string; name: string; description?: string; mapUrl?: string };
const days: { date: string; title: string; activities?: Activity[] }[] = [
  { date: "2026-11-11", title: "Osaka", activities: [
    { time: "05:00", name: "ออกเดินทางไปสนามบิน", description: "รวมตัวที่คอนโดโชกุนให้พร้อม เช็กสัมภาระและเอกสารการเดินทาง จากนั้นออกเดินทางไปสนามบินดอนเมือง (DMK)" },
    { time: "07:30", name: "เช็คอินเข้า gate", description: "เช็กอินเที่ยวบิน ฝากสัมภาระ (ถ้ามี) ผ่าน ตม. และ Security จากนั้นเดินไปยัง Gate และรอขึ้นเครื่อง ควรถึง Gate ก่อนเวลา Boarding อย่างน้อย 30 นาที" },
    { time: "18:15", name: "ถึงญี่ปุ่น", description: "เดินทางถึงสนามบินคันไซ (KIX) ผ่าน ตม. รับสัมภาระ และเตรียมเดินทางเข้าสู่ที่พัก" },
    { time: "19:00", name: "เดินทางเข้าที่พัก", description: "ออกจากสนามบินคันไซ (KIX) เดินทางเข้าสู่ที่พักย่าน Namba เช็กอินและเก็บสัมภาระให้เรียบร้อย", mapUrl: NAMBA_MAP },
    { time: "20:00", name: "ถึงที่พัก", description: "เช็กอินและเก็บสัมภาระ จากนั้นแยกย้ายพักผ่อน หรือออกไปเดินเล่นและเที่ยวยามค่ำคืนตามสะดวก" },
  ] },
  { date: "2026-11-12", title: "Osaka" },
  { date: "2026-11-13", title: "Kyoto", activities: [
    { time: "07:00", name: "ออกจากที่พัก", description: "เดินทางจาก Osaka ไป Kyoto" },
    { time: "09:00", name: "Kiyomizu-dera", description: "เที่ยววัดน้ำใส แนะนำให้ไปช่วงเช้าเพื่อหลีกเลี่ยงคนเยอะ" },
    { time: "11:00", name: "Sannenzaka", description: "เดินเล่นย่านเมืองเก่า" },
  ] },
  { date: "2026-11-14", title: "Nara" },
  { date: "2026-11-15", title: "Kobe" },
  { date: "2026-11-16", title: "Osaka" },
  { date: "2026-11-17", title: "Osaka" },
  { date: "2026-11-18", title: "เดินทางกลับ" },
];

async function main() {
  await prisma.trip.deleteMany();
  await prisma.trip.create({
    data: {
      name: "เที่ยวญี่ปุ่น 2026",
      startDate: date("2026-11-11"),
      endDate: date("2026-11-18"),
      takeoffDate: date("2026-11-11"), takeoffTime: "10:40", landingTime: "18:15",
      returnDate: date("2026-11-18"), returnTime: "21:00", returnLandingTime: "01:30",
      accommodation: { create: { name: "Apartment Hotel 11 Namba Minami 2", mapUrl: "https://maps.app.goo.gl/NS5CUCsDU57Y83mMA" } },
      days: {
        create: days.map(({ date: day, title, activities }, sortOrder) => ({
          date: date(day), title, sortOrder,
          activities: { create: (activities ?? []).map((a, order) => ({ time: a.time, name: a.name, description: a.description ?? null, mapUrl: a.mapUrl ?? null, sortOrder: order })) },
        })),
      },
    },
  });
  console.log(`seeded ${days.length} days, ${days.reduce((n, d) => n + (d.activities?.length ?? 0), 0)} activities`);
}

main().finally(() => prisma.$disconnect());
