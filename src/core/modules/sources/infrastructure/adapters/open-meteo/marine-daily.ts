// Adapter DS-05 Open-Meteo Marine theo NGÀY: sóng lớn nhất, sóng lừng, chu kỳ, hướng sóng (GMT+7).
// Gió theo ngày lấy từ Forecast API (cùng URL với tab Sắp tới → dùng chung cache), ghép ở tầng application.
import { degreesToCompassEn } from "@/shared/format/units";
import { makeAttribution } from "../../../domain/attribution";
import type { Attribution, SourceDefinition } from "../../../domain/registry-schema";
import { OPEN_METEO_MARINE_BASE } from "./adapter";
import { OpenMeteoMarineDailySchema, type OpenMeteoMarineDaily } from "./schema";

/** Số ngày sóng lấy về. Marine API cho tới 16 ngày nhưng độ tin cậy giảm nhanh → 7 ngày. */
export const SEA_DAYS = 7;

export interface SeaDayRaw {
  date: string; // "YYYY-MM-DD" GMT+7
  waveMaxM: number | null;
  swellMaxM: number | null;
  wavePeriodS: number | null;
  /** Hướng sóng tới (la bàn 16 hướng, EN). */
  waveDir: string | null;
}

export interface MarineDailyNormalized {
  point: { lat: number; lon: number };
  rows: SeaDayRaw[];
  attribution: Attribution;
}

export function openMeteoMarineDailyUrl(lat: number, lon: number, days = SEA_DAYS): string {
  const q = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: "wave_height_max,wave_direction_dominant,wave_period_max,swell_wave_height_max",
    timezone: "Asia/Bangkok",
    forecast_days: String(days),
  });
  return `${OPEN_METEO_MARINE_BASE}?${q.toString()}`;
}

export function parseOpenMeteoMarineDaily(raw: unknown): OpenMeteoMarineDaily {
  const r = OpenMeteoMarineDailySchema.safeParse(raw);
  if (!r.success) throw new Error(`Open-Meteo marine daily: payload sai schema — ${r.error.issues[0]?.message ?? "unknown"}`);
  const unit = r.data.daily_units?.wave_height_max;
  if (unit && unit !== "m") throw new Error(`Open-Meteo marine daily: đơn vị sóng ${unit}, cần m`);
  return r.data;
}

const round1 = (v: number) => Math.round(v * 10) / 10;
const at = (s: ReadonlyArray<number | null> | undefined, i: number): number | null => s?.[i] ?? null;

/** Chuẩn hoá `daily` của Marine API. Thiếu → null, không nội suy (BR-01). */
export function normalizeMarineDaily(def: SourceDefinition, raw: OpenMeteoMarineDaily, meta: { fetchedAt: string; sourceUrl: string }): MarineDailyNormalized {
  const d = raw.daily;
  const rows = d.time.map((date, i): SeaDayRaw => {
    const wave = at(d.wave_height_max, i);
    const swell = at(d.swell_wave_height_max, i);
    const period = at(d.wave_period_max, i);
    return {
      date: date.slice(0, 10),
      waveMaxM: wave === null ? null : round1(wave),
      swellMaxM: swell === null ? null : round1(swell),
      wavePeriodS: period === null ? null : Math.round(period),
      waveDir: degreesToCompassEn(at(d.wave_direction_dominant, i)),
    };
  });
  return {
    point: { lat: raw.latitude, lon: raw.longitude },
    rows,
    attribution: makeAttribution(def, { issuedAt: null, fetchedAt: meta.fetchedAt, sourceUrl: meta.sourceUrl, modified: true }),
  };
}
