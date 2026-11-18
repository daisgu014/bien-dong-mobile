import type { Attribution } from "@/modules/risk";

/** Một ngày (lịch GMT+7) — dự báo 16 ngày hoặc thời tiết đã qua. Thiếu trường → null (BR-01). */
export interface DailyWeatherRow {
  date: string; // "YYYY-MM-DD" GMT+7
  weatherCode: number | null; // WMO 4677
  tMaxC: number | null;
  tMinC: number | null;
  rainMm: number | null;
  rainProbPct: number | null; // chỉ có ở dự báo
  windLevel: number | null; // cấp Beaufort VN (đã chuyển đổi)
  gustLevel: number | null;
  windDir: string | null;
}

/** Điều kiện hiện tại (chỉ có ở dự báo). */
export interface CurrentWeather {
  at: string; // ISO UTC
  tempC: number | null;
  weatherCode: number | null;
  isDay: boolean | null;
}

/** DTO thời tiết theo ngày tại một khu vực. Luôn kèm attribution (CLAUDE.md quy tắc 1). */
export interface DailyWeather {
  kind: "forecast" | "history";
  placeName: string;
  point: { lat: number; lon: number };
  /** Hiện tại — null ở dữ liệu đã qua hoặc khi nguồn không trả. */
  current: CurrentWeather | null;
  rows: DailyWeatherRow[];
  attribution: Attribution;
}

/** Một tuần xu hướng (trung bình tổ hợp EC46) — ngày 17–30. Độ tin cậy thấp, chỉ là khuynh hướng. */
export interface OutlookWeekRow {
  from: string;
  to: string;
  days: number;
  tMaxMeanC: number | null;
  tMinMeanC: number | null;
  rainSumMm: number | null;
  members: number;
}

export interface WeatherOutlook {
  placeName: string;
  point: { lat: number; lon: number };
  weeks: OutlookWeekRow[];
  attribution: Attribution;
}

/** Một giờ (dự báo hoặc đã qua) — chi tiết trong ngày. Thiếu → null (BR-01). */
export interface HourWeatherRow {
  at: string; // ISO UTC
  local: string; // "YYYY-MM-DDTHH:mm" GMT+7
  tempC: number | null;
  feelsC: number | null;
  weatherCode: number | null;
  isDay: boolean | null;
  rainMm: number | null;
  rainProbPct: number | null; // chỉ có ở dự báo
  humidityPct: number | null;
  windLevel: number | null; // cấp Beaufort VN (đã chuyển đổi)
  gustLevel: number | null;
  windDir: string | null;
}

/** DTO thời tiết theo giờ trong các ngày [from, to] (GMT+7). Luôn kèm attribution. */
export interface HourWeather {
  kind: "forecast" | "history";
  placeName: string;
  point: { lat: number; lon: number };
  from: string;
  to: string;
  rows: HourWeatherRow[];
  attribution: Attribution;
}
