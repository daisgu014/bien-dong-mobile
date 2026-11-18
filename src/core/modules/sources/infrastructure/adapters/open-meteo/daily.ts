// Adapter DS-05 Open-Meteo theo NGÀY: dự báo 16 ngày, thời tiết đã qua (archive), xu hướng ngày 17–30 (seasonal EC46).
// Ngày tính theo lịch GMT+7 (timezone=Asia/Bangkok, cùng UTC+7 với Asia/Ho_Chi_Minh). Gió đổi m/s → cấp Beaufort VN (modified: true).
import { degreesToCompassEn, toBeaufortVn } from "@/shared/format/units";
import { makeAttribution } from "../../../domain/attribution";
import type { Attribution, SourceDefinition } from "../../../domain/registry-schema";
import {
  OpenMeteoDailySchema,
  OpenMeteoHourlyDaySchema,
  OpenMeteoSeasonalSchema,
  type OpenMeteoDaily,
  type OpenMeteoHourlyDay,
  type OpenMeteoSeasonal,
} from "./schema";

export const OPEN_METEO_ARCHIVE_BASE = "https://archive-api.open-meteo.com/v1/archive";
export const OPEN_METEO_SEASONAL_BASE = "https://seasonal-api.open-meteo.com/v1/seasonal";
const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
const TZ = "Asia/Bangkok";

const DAILY_VARS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "wind_direction_10m_dominant",
] as const;

/** Số ngày tối đa của Forecast API. */
export const DAILY_FORECAST_DAYS = 16;

export interface DailyRow {
  /** Ngày theo lịch GMT+7, "YYYY-MM-DD". */
  date: string;
  /** Mã thời tiết WMO 4677 do nguồn trả. */
  weatherCode: number | null;
  tMaxC: number | null;
  tMinC: number | null;
  rainMm: number | null;
  /** Xác suất mưa lớn nhất trong ngày (%), chỉ có ở dự báo. */
  rainProbPct: number | null;
  windLevel: number | null;
  gustLevel: number | null;
  windDir: string | null;
}

/** Điều kiện hiện tại tại điểm (giá trị mô hình gần nhất của nguồn, cập nhật ~15 phút). */
export interface CurrentConditions {
  /** Mốc thời gian của giá trị, ISO UTC. */
  at: string;
  tempC: number | null;
  weatherCode: number | null;
  /** true = ban ngày theo nguồn (is_day). null khi nguồn không trả. */
  isDay: boolean | null;
}

export interface DailyNormalized {
  point: { lat: number; lon: number };
  current: CurrentConditions | null;
  rows: DailyRow[];
  attribution: Attribution;
}

export interface OutlookWeek {
  /** Ngày đầu/cuối (GMT+7, "YYYY-MM-DD"), gồm cả hai đầu. */
  from: string;
  to: string;
  /** Số ngày có dữ liệu trong tuần. */
  days: number;
  tMaxMeanC: number | null;
  tMinMeanC: number | null;
  /** Tổng mưa của tuần theo trung bình tổ hợp. */
  rainSumMm: number | null;
  /** Số thành viên tổ hợp đã lấy trung bình (1 nếu nguồn trả sẵn trung bình). */
  members: number;
}

export interface OutlookNormalized {
  point: { lat: number; lon: number };
  weeks: OutlookWeek[];
  attribution: Attribution;
}

function q(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

export function openMeteoDailyForecastUrl(lat: number, lon: number): string {
  return `${FORECAST_BASE}?${q({
    latitude: String(lat),
    longitude: String(lon),
    daily: [...DAILY_VARS, "precipitation_probability_max"].join(","),
    current: "temperature_2m,weather_code,is_day",
    wind_speed_unit: "ms",
    timezone: TZ,
    forecast_days: String(DAILY_FORECAST_DAYS),
  })}`;
}

export function openMeteoArchiveUrl(lat: number, lon: number, from: string, to: string): string {
  return `${OPEN_METEO_ARCHIVE_BASE}?${q({
    latitude: String(lat),
    longitude: String(lon),
    start_date: from,
    end_date: to,
    daily: DAILY_VARS.join(","),
    wind_speed_unit: "ms",
    timezone: TZ,
  })}`;
}

export function openMeteoSeasonalUrl(lat: number, lon: number, from: string, to: string): string {
  return `${OPEN_METEO_SEASONAL_BASE}?${q({
    latitude: String(lat),
    longitude: String(lon),
    start_date: from,
    end_date: to,
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
    timezone: TZ,
  })}`;
}

export function parseOpenMeteoDaily(raw: unknown): OpenMeteoDaily {
  const r = OpenMeteoDailySchema.safeParse(raw);
  if (!r.success) throw new Error(`Open-Meteo daily: payload sai schema — ${r.error.issues[0]?.message ?? "unknown"}`);
  const unit = r.data.daily_units?.wind_speed_10m_max;
  if (unit && unit !== "m/s") throw new Error(`Open-Meteo daily: đơn vị gió ${unit}, cần m/s`);
  return r.data;
}

export function parseOpenMeteoSeasonal(raw: unknown): OpenMeteoSeasonal {
  const r = OpenMeteoSeasonalSchema.safeParse(raw);
  if (!r.success) throw new Error(`Open-Meteo seasonal: payload sai schema — ${r.error.issues[0]?.message ?? "unknown"}`);
  return r.data;
}

const round1 = (v: number) => Math.round(v * 10) / 10;
const at = (s: ReadonlyArray<number | null> | undefined, i: number): number | null => s?.[i] ?? null;

/** Chuẩn hoá `daily` của Forecast/Archive API. Thiếu giá trị → null, không nội suy. */
export function normalizeDaily(def: SourceDefinition, raw: OpenMeteoDaily, meta: { fetchedAt: string; sourceUrl: string }): DailyNormalized {
  const d = raw.daily;
  const rows: DailyRow[] = d.time.map((date, i) => {
    const wind = at(d.wind_speed_10m_max, i);
    const gust = at(d.wind_gusts_10m_max, i);
    const tMax = at(d.temperature_2m_max, i);
    const tMin = at(d.temperature_2m_min, i);
    const rain = at(d.precipitation_sum, i);
    const code = at(d.weather_code, i);
    return {
      date: date.slice(0, 10),
      weatherCode: code === null ? null : Math.round(code),
      tMaxC: tMax === null ? null : round1(tMax),
      tMinC: tMin === null ? null : round1(tMin),
      rainMm: rain === null ? null : round1(rain),
      rainProbPct: at(d.precipitation_probability_max, i),
      windLevel: wind === null ? null : toBeaufortVn(wind),
      gustLevel: gust === null ? null : toBeaufortVn(gust),
      windDir: degreesToCompassEn(at(d.wind_direction_10m_dominant, i)),
    };
  });
  const c = raw.current;
  // `current.time` theo múi giờ yêu cầu (GMT+7, không kèm offset) → đổi về UTC bằng utc_offset_seconds.
  const current: CurrentConditions | null = c
    ? {
        at: new Date(new Date(`${c.time.slice(0, 16)}:00Z`).getTime() - raw.utc_offset_seconds * 1000).toISOString(),
        tempC: c.temperature_2m == null ? null : round1(c.temperature_2m),
        weatherCode: c.weather_code == null ? null : Math.round(c.weather_code),
        isDay: c.is_day == null ? null : c.is_day === 1,
      }
    : null;
  return {
    point: { lat: raw.latitude, lon: raw.longitude },
    current,
    rows,
    attribution: makeAttribution(def, { issuedAt: null, fetchedAt: meta.fetchedAt, sourceUrl: meta.sourceUrl, modified: true }),
  };
}

/** Các chuỗi của một biến: chuỗi gốc `<v>` và/hoặc `<v>_memberNN`. */
function seriesOf(daily: OpenMeteoSeasonal["daily"], name: string): Array<ReadonlyArray<number | null>> {
  const re = new RegExp(`^${name}(_member\\d+)?$`);
  return Object.entries(daily)
    .filter(([k]) => k !== "time" && re.test(k))
    .map(([, v]) => v as ReadonlyArray<number | null>);
}

/** Trung bình các thành viên tại ngày i (bỏ null). Không thành viên nào có số → null. */
function memberMean(list: Array<ReadonlyArray<number | null>>, i: number): number | null {
  let sum = 0;
  let n = 0;
  for (const s of list) {
    const v = s[i];
    if (v !== null && v !== undefined) {
      sum += v;
      n += 1;
    }
  }
  return n === 0 ? null : sum / n;
}

/**
 * Xu hướng theo tuần từ Seasonal API: trung bình tổ hợp từng ngày → gộp mỗi 7 ngày.
 * Đây là tổng hợp do app tính (modified: true) — nhiệt độ TB, tổng mưa TB; không suy ra ngày mưa cụ thể.
 */
export function normalizeSeasonalWeekly(
  def: SourceDefinition,
  raw: OpenMeteoSeasonal,
  meta: { fetchedAt: string; sourceUrl: string },
  weekDays = 7,
): OutlookNormalized {
  const d = raw.daily;
  const tMax = seriesOf(d, "temperature_2m_max");
  const tMin = seriesOf(d, "temperature_2m_min");
  const rain = seriesOf(d, "precipitation_sum");
  const members = Math.max(tMax.length, tMin.length, rain.length);

  const weeks: OutlookWeek[] = [];
  for (let start = 0; start < d.time.length; start += weekDays) {
    const idx = d.time.slice(start, start + weekDays).map((_, k) => start + k);
    const daily = idx.map((i) => ({ tMax: memberMean(tMax, i), tMin: memberMean(tMin, i), rain: memberMean(rain, i) }));
    const mean = (vals: Array<number | null>) => {
      const ok = vals.filter((v): v is number => v !== null);
      return ok.length === 0 ? null : round1(ok.reduce((a, b) => a + b, 0) / ok.length);
    };
    const rains = daily.map((x) => x.rain).filter((v): v is number => v !== null);
    const days = daily.filter((x) => x.tMax !== null || x.tMin !== null || x.rain !== null).length;
    weeks.push({
      from: (d.time[idx[0] ?? 0] ?? "").slice(0, 10),
      to: (d.time[idx[idx.length - 1] ?? 0] ?? "").slice(0, 10),
      days,
      tMaxMeanC: mean(daily.map((x) => x.tMax)),
      tMinMeanC: mean(daily.map((x) => x.tMin)),
      // Tổng mưa chỉ khi đủ ngày có số liệu — thiếu ngày thì không cộng thiếu thành "ít mưa".
      rainSumMm: rains.length === idx.length && rains.length > 0 ? round1(rains.reduce((a, b) => a + b, 0)) : null,
      members,
    });
  }
  return {
    point: { lat: raw.latitude, lon: raw.longitude },
    weeks,
    attribution: makeAttribution(def, { issuedAt: null, fetchedAt: meta.fetchedAt, sourceUrl: meta.sourceUrl, modified: true }),
  };
}

// ---------------------------------------------------------------------------------------------
// Theo GIỜ trong các ngày [from, to] (GMT+7): Forecast API (≤ 16 ngày tới) hoặc archive (ngày đã qua).

const HOURLY_VARS = [
  "temperature_2m",
  "apparent_temperature",
  "weather_code",
  "is_day",
  "precipitation",
  "relative_humidity_2m",
  "wind_speed_10m",
  "wind_gusts_10m",
  "wind_direction_10m",
] as const;

export interface HourRow {
  /** Mốc giờ, ISO UTC. */
  at: string;
  /** Ngày giờ địa phương GMT+7 "YYYY-MM-DDTHH:mm" — để nhóm theo ngày, ghi giờ. */
  local: string;
  tempC: number | null;
  feelsC: number | null;
  weatherCode: number | null;
  isDay: boolean | null;
  rainMm: number | null;
  /** Chỉ có ở dự báo. */
  rainProbPct: number | null;
  humidityPct: number | null;
  windLevel: number | null;
  gustLevel: number | null;
  windDir: string | null;
}

export interface HoursNormalized {
  point: { lat: number; lon: number };
  rows: HourRow[];
  attribution: Attribution;
}

export function openMeteoHourlyUrl(kind: "forecast" | "history", lat: number, lon: number, from: string, to: string): string {
  const vars = kind === "forecast" ? [...HOURLY_VARS, "precipitation_probability"] : HOURLY_VARS;
  return `${kind === "forecast" ? FORECAST_BASE : OPEN_METEO_ARCHIVE_BASE}?${q({
    latitude: String(lat),
    longitude: String(lon),
    start_date: from,
    end_date: to,
    hourly: vars.join(","),
    wind_speed_unit: "ms",
    timezone: TZ,
  })}`;
}

export function parseOpenMeteoHourlyDay(raw: unknown): OpenMeteoHourlyDay {
  const r = OpenMeteoHourlyDaySchema.safeParse(raw);
  if (!r.success) throw new Error(`Open-Meteo hourly: payload sai schema — ${r.error.issues[0]?.message ?? "unknown"}`);
  const unit = r.data.hourly_units?.wind_speed_10m;
  if (unit && unit !== "m/s") throw new Error(`Open-Meteo hourly: đơn vị gió ${unit}, cần m/s`);
  return r.data;
}

/** Chuẩn hoá `hourly`: giờ địa phương → UTC bằng utc_offset_seconds; thiếu → null (không nội suy, BR-01). */
export function normalizeHourlyDay(def: SourceDefinition, raw: OpenMeteoHourlyDay, meta: { fetchedAt: string; sourceUrl: string }): HoursNormalized {
  const h = raw.hourly;
  const rows: HourRow[] = h.time.map((time, i) => {
    const local = time.slice(0, 16);
    const temp = at(h.temperature_2m, i);
    const feels = at(h.apparent_temperature, i);
    const code = at(h.weather_code, i);
    const day = at(h.is_day, i);
    const rain = at(h.precipitation, i);
    const wind = at(h.wind_speed_10m, i);
    const gust = at(h.wind_gusts_10m, i);
    return {
      at: new Date(new Date(`${local}:00Z`).getTime() - raw.utc_offset_seconds * 1000).toISOString(),
      local,
      tempC: temp === null ? null : round1(temp),
      feelsC: feels === null ? null : round1(feels),
      weatherCode: code === null ? null : Math.round(code),
      isDay: day === null ? null : day === 1,
      rainMm: rain === null ? null : round1(rain),
      rainProbPct: at(h.precipitation_probability, i),
      humidityPct: at(h.relative_humidity_2m, i),
      windLevel: wind === null ? null : toBeaufortVn(wind),
      gustLevel: gust === null ? null : toBeaufortVn(gust),
      windDir: degreesToCompassEn(at(h.wind_direction_10m, i)),
    };
  });
  return {
    point: { lat: raw.latitude, lon: raw.longitude },
    rows,
    attribution: makeAttribution(def, { issuedAt: null, fetchedAt: meta.fetchedAt, sourceUrl: meta.sourceUrl, modified: true }),
  };
}
