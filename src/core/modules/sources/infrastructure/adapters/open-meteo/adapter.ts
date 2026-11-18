// Adapter DS-05 Open-Meteo → HourlyForecastRow (UC-04): 8 mốc 3 giờ. Đã chuyển đổi sang cấp Beaufort (modified: true).
import { degreesToCompassEn, toBeaufortVn } from "@/shared/format/units";
import { makeAttribution } from "../../../domain/attribution";
import type { Attribution, SourceDefinition } from "../../../domain/registry-schema";
import { OpenMeteoForecastSchema, OpenMeteoMarineSchema, type OpenMeteoForecast, type OpenMeteoMarine } from "./schema";

export const OPEN_METEO_FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
export const OPEN_METEO_MARINE_BASE = "https://marine-api.open-meteo.com/v1/marine";

export interface HourlyRow {
  at: string;
  windLevel: number | null;
  gustLevel: number | null;
  rainMm: number | null;
  seaHeightM: [number, number] | null;
  windDir: string | null;
}

export interface HourlyForecastNormalized {
  point: { lat: number; lon: number };
  rows: HourlyRow[];
  attribution: Attribution;
}

/** Làm tròn 0,05° để cache theo điểm (source-notes DS-05). */
export function roundPoint(lat: number, lon: number): { lat: number; lon: number } {
  const r = (v: number) => Math.round(v * 20) / 20;
  return { lat: r(lat), lon: r(lon) };
}

export function openMeteoForecastUrl(lat: number, lon: number): string {
  const q = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: "wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation",
    wind_speed_unit: "ms", // đổi cấp Beaufort từ m/s cho chuẩn
    timezone: "UTC",
    forecast_days: "3",
  });
  return `${OPEN_METEO_FORECAST_BASE}?${q.toString()}`;
}

export function openMeteoMarineUrl(lat: number, lon: number): string {
  const q = new URLSearchParams({ latitude: String(lat), longitude: String(lon), hourly: "wave_height", timezone: "UTC", forecast_days: "3" });
  return `${OPEN_METEO_MARINE_BASE}?${q.toString()}`;
}

export function parseOpenMeteoForecast(raw: unknown): OpenMeteoForecast {
  const r = OpenMeteoForecastSchema.safeParse(raw);
  if (!r.success) throw new Error(`Open-Meteo forecast: payload sai schema — ${r.error.issues[0]?.message ?? "unknown"}`);
  if (r.data.hourly_units.wind_speed_10m && r.data.hourly_units.wind_speed_10m !== "m/s") {
    throw new Error(`Open-Meteo forecast: đơn vị gió ${r.data.hourly_units.wind_speed_10m}, cần m/s`);
  }
  return r.data;
}

export function parseOpenMeteoMarine(raw: unknown): OpenMeteoMarine {
  const r = OpenMeteoMarineSchema.safeParse(raw);
  if (!r.success) throw new Error(`Open-Meteo marine: payload sai schema — ${r.error.issues[0]?.message ?? "unknown"}`);
  return r.data;
}

/** Khoá so khớp giờ: "YYYY-MM-DDTHH:MM" (Open-Meteo trả giờ không có giây, timezone=UTC). */
const timeKey = (t: string) => t.slice(0, 16);

/**
 * Gộp thành 8 mốc 3 giờ kể từ mốc 3h-aligned đầu tiên ≥ `now`.
 * - windLevel/gustLevel/windDir: giá trị tại giờ mốc → cấp Beaufort VN.
 * - rainMm: tổng 3 giờ [t, t+3h). seaHeightM: [min, max] sóng trong 3 giờ đó.
 * Thiếu trường → null. Không nội suy.
 */
export function normalizeHourly(
  def: SourceDefinition,
  forecast: OpenMeteoForecast,
  marine: OpenMeteoMarine | null,
  meta: { now: string; fetchedAt: string; sourceUrl: string },
  steps = 8,
): HourlyForecastNormalized {
  const h = forecast.hourly;
  const idxByTime = new Map(h.time.map((t, i) => [timeKey(t), i] as const));
  const marineIdx = marine ? new Map(marine.hourly.time.map((t, i) => [timeKey(t), i] as const)) : null;

  const nowMs = new Date(meta.now).getTime();
  const start = Math.ceil(nowMs / (3 * 3_600_000)) * 3 * 3_600_000;

  const rows: HourlyRow[] = [];
  for (let s = 0; s < steps; s += 1) {
    const atMs = start + s * 3 * 3_600_000;
    const at = new Date(atMs).toISOString();
    const i = idxByTime.get(timeKey(at));
    if (i === undefined) {
      rows.push({ at, windLevel: null, gustLevel: null, rainMm: null, seaHeightM: null, windDir: null });
      continue;
    }
    const wind = h.wind_speed_10m?.[i] ?? null;
    const gust = h.wind_gusts_10m?.[i] ?? null;
    const dir = h.wind_direction_10m?.[i] ?? null;

    let rain: number | null = null;
    if (h.precipitation) {
      const vals = [0, 1, 2].map((k) => h.precipitation?.[i + k] ?? null);
      if (vals.some((v) => v !== null)) rain = vals.reduce<number>((acc, v) => acc + (v ?? 0), 0);
    }

    let sea: [number, number] | null = null;
    if (marine && marineIdx) {
      const mi = marineIdx.get(timeKey(at));
      if (mi !== undefined) {
        const vals = [0, 1, 2].map((k) => marine.hourly.wave_height?.[mi + k] ?? null).filter((v): v is number => v !== null);
        if (vals.length > 0) sea = [Math.min(...vals), Math.max(...vals)];
      }
    }

    rows.push({
      at,
      windLevel: wind === null ? null : toBeaufortVn(wind),
      gustLevel: gust === null ? null : toBeaufortVn(gust),
      rainMm: rain === null ? null : Math.round(rain * 10) / 10,
      seaHeightM: sea,
      windDir: degreesToCompassEn(dir),
    });
  }

  return {
    point: { lat: forecast.latitude, lon: forecast.longitude },
    rows,
    attribution: makeAttribution(def, { issuedAt: null, fetchedAt: meta.fetchedAt, sourceUrl: meta.sourceUrl, modified: true }),
  };
}
