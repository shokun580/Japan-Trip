import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudRainWind, CloudSun, Snowflake, Sun, type LucideIcon } from "lucide-react";
import { dayLabel } from "@/lib/format";
import type { DayData } from "@/lib/types";
import type { Forecast, ForecastByDate } from "@/lib/weather";

// WMO weather codes, as Open-Meteo reports them, in the few words a day needs.
export function describe(code: number): { label: string; Icon: LucideIcon } {
  if (code === 0) return { label: "แดดจัด", Icon: Sun };
  if (code <= 2) return { label: "มีเมฆบ้าง", Icon: CloudSun };
  if (code === 3) return { label: "เมฆมาก", Icon: Cloud };
  if (code <= 48) return { label: "หมอก", Icon: CloudFog };
  if (code <= 57) return { label: "ฝนปรอย", Icon: CloudDrizzle };
  if (code <= 67) return { label: "ฝนตก", Icon: CloudRain };
  if (code <= 77) return { label: "หิมะ", Icon: Snowflake };
  if (code <= 82) return { label: "ฝนซู่", Icon: CloudRainWind };
  return { label: "ฟ้าคะนอง", Icon: CloudLightning };
}

// One line for a day's header: icon, high/low and the chance of rain when it matters.
export function WeatherLine({ forecast }: { forecast: Forecast | undefined }) {
  if (!forecast) return null;
  const { label, Icon } = describe(forecast.code);
  return <span className="inline-flex items-center gap-1.5 text-[.85rem] text-[var(--muted)]" title={label}>
    <Icon size={16} aria-hidden/>{label} {forecast.high}°/{forecast.low}°{forecast.rain >= 30 && ` · ฝน ${forecast.rain}%`}
  </span>;
}

// The trip's days in a row, from today on, each with its sky and temperatures.
// Days past the forecast's reach are simply not there yet.
export function WeatherStrip({ days, forecast, today }: { days: DayData[]; forecast: ForecastByDate; today: string }) {
  const shown = days.filter((d) => d.date >= today && forecast[d.date]);
  if (!shown.length) return <div className="card flex items-center gap-3 border-dashed px-4 py-3"><span className="min-w-0 flex-1"><span className="eyebrow block">อากาศ</span><span className="block truncate text-[.92rem] text-[var(--muted)]">ยังไม่มีพยากรณ์สำหรับวันเดินทาง</span></span></div>;
  return <section className="card px-4 pt-2 pb-2" aria-label="พยากรณ์อากาศ">
    <div className="flex items-baseline justify-between"><p className="eyebrow">อากาศ</p><p className="text-[.72rem] text-[var(--muted)]">ตามเมืองของแต่ละวัน</p></div>
    <ul className="slider mt-2 -mx-1 flex gap-2 px-1">{shown.map((d) => {
      const f = forecast[d.date], { label, Icon } = describe(f.code);
      const isToday = d.date === today;
      return <li key={d.id} className={`flex w-[74px] shrink-0 flex-col items-center rounded-2xl border px-1.5 py-1 text-center ${isToday ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--on-dark)]" : "border-[var(--line)]"}`} aria-label={`${dayLabel(d.date)} ${label} สูงสุด ${f.high} ต่ำสุด ${f.low} โอกาสฝน ${f.rain}%`}>
        <span className="text-[.78rem] font-medium">{isToday ? "วันนี้" : dayLabel(d.date)}</span>
        <Icon size={22} className="my-0.5" aria-hidden/>
        <span className="text-[.95rem] font-semibold tabular-nums">{f.high}°<span className={`font-normal ${isToday ? "text-[var(--on-dark-soft)]" : "text-[var(--muted)]"}`}>/{f.low}°</span></span>
        <span className={`mt-0.5 text-[.72rem] ${isToday ? "text-[var(--on-dark-soft)]" : "text-[var(--muted)]"}`}>{f.rain >= 30 ? `ฝน ${f.rain}%` : label}</span>
      </li>;
    })}</ul>
  </section>;
}
