import type { DayData } from "./types";

// Daily forecast from Open-Meteo, which needs no key. Each trip day is looked up in
// the city its title names, so the Kyoto day gets Kyoto's weather; anything else is
// Osaka. Fetched on the server and cached for half an hour, so the home page carries
// the forecast in its HTML and the offline copy still shows the last one seen.
export type Forecast = { code: number; high: number; low: number; rain: number };
export type ForecastByDate = Record<string, Forecast>;

const CITIES = {
  osaka: { lat: 34.69, lon: 135.5 },
  kyoto: { lat: 35.01, lon: 135.77 },
  nara: { lat: 34.69, lon: 135.8 },
  kobe: { lat: 34.69, lon: 135.2 },
} as const;
type City = keyof typeof CITIES;

const cityOf = (title: string): City => {
  const t = title.toLowerCase();
  if (/kyoto|เกียวโต/.test(t)) return "kyoto";
  if (/nara|นารา/.test(t)) return "nara";
  if (/kobe|โกเบ/.test(t)) return "kobe";
  return "osaka";
};

type Daily = { time: string[]; weather_code: (number | null)[]; temperature_2m_max: (number | null)[]; temperature_2m_min: (number | null)[]; precipitation_probability_max: (number | null)[] };

async function fetchCity(city: City): Promise<ForecastByDate> {
  const { lat, lon } = CITIES[city];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=16`;
  const response = await fetch(url, { next: { revalidate: 1800 } });
  if (!response.ok) throw new Error(`open-meteo ${response.status}`);
  const { daily } = (await response.json()) as { daily: Daily };
  const out: ForecastByDate = {};
  daily.time.forEach((date, i) => {
    const code = daily.weather_code[i], high = daily.temperature_2m_max[i], low = daily.temperature_2m_min[i];
    if (code === null || high === null || low === null) return;
    out[date] = { code, high: Math.round(high), low: Math.round(low), rain: daily.precipitation_probability_max[i] ?? 0 };
  });
  return out;
}

// One entry per trip day that the forecast reaches (about two weeks out). A failed
// fetch leaves the map empty rather than failing the page: the weather is a nicety.
export async function getForecast(days: DayData[]): Promise<ForecastByDate> {
  const wanted = new Set(days.map((d) => cityOf(d.title)));
  const byCity = new Map<City, ForecastByDate>();
  await Promise.all([...wanted].map(async (city) => { try { byCity.set(city, await fetchCity(city)); } catch { /* no forecast for this city today */ } }));
  const out: ForecastByDate = {};
  for (const day of days) {
    const forecast = byCity.get(cityOf(day.title))?.[day.date];
    if (forecast) out[day.date] = forecast;
  }
  return out;
}
