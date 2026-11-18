import { fetchOpenMeteoArchive, fetchOpenMeteoDailyForecast, fetchOpenMeteoHours, fetchOpenMeteoOutlook, type SourcePolicyEnv } from "@/modules/sources";
import { HISTORY_MIN_DATE, addDays, dateGmt7, daysBetween, validateHistoryRange, type HistoryRangeError } from "../domain/dates";
import type { DailyWeather, HourWeather, WeatherOutlook } from "../domain/daily-types";

interface Input {
  lat: number;
  lon: number;
  placeName: string;
  now: Date;
  policyEnv: SourcePolicyEnv;
  contactEmail: string;
}

export type DailyResult = { ok: true; data: DailyWeather } | { ok: false; reason: string };
export type OutlookResult = { ok: true; data: WeatherOutlook } | { ok: false; reason: string };
export type HistoryResult = DailyResult | { ok: false; reason: "invalid_range"; error: HistoryRangeError };

/** Ngày bắt đầu/kết thúc phần xu hướng: ngày thứ 17 → 30 tính cả hôm nay (16 ngày đầu là dự báo theo ngày). */
export const OUTLOOK_FIRST_DAY = 17;
export const OUTLOOK_LAST_DAY = 30;

/** Tab DỰ BÁO: 16 ngày tại một khu vực (DS-05). Cache 1 giờ — dữ liệu mô hình đổi vài lần/ngày. */
export async function getDailyForecast(input: Input): Promise<DailyResult> {
  const r = await fetchOpenMeteoDailyForecast({ ...input, revalidateSeconds: 3600 });
  if (!r.ok) return r;
  return { ok: true, data: { kind: "forecast", placeName: input.placeName, point: r.data.point, current: r.data.current, rows: r.data.rows, attribution: r.data.attribution } };
}

/** Xu hướng ngày 17–30 (EC46, trung bình tổ hợp) theo tuần. Cache 6 giờ — EC46 cập nhật mỗi ngày một lần. */
export async function getWeatherOutlook(input: Input): Promise<OutlookResult> {
  const today = dateGmt7(input.now);
  const r = await fetchOpenMeteoOutlook({
    ...input,
    from: addDays(today, OUTLOOK_FIRST_DAY - 1),
    to: addDays(today, OUTLOOK_LAST_DAY - 1),
    revalidateSeconds: 6 * 3600,
  });
  if (!r.ok) return r;
  return { ok: true, data: { placeName: input.placeName, point: r.data.point, weeks: r.data.weeks, attribution: r.data.attribution } };
}

/** Thời tiết đã qua [from, to] (GMT+7), tối đa 31 ngày, kết thúc trước hôm nay. Cache 1 ngày. */
export async function getWeatherHistory(input: Input & { from: string; to: string }): Promise<HistoryResult> {
  const error = validateHistoryRange(input.from, input.to, dateGmt7(input.now));
  if (error) return { ok: false, reason: "invalid_range", error };
  const r = await fetchOpenMeteoArchive({ ...input, revalidateSeconds: 24 * 3600 });
  if (!r.ok) return r;
  return { ok: true, data: { kind: "history", placeName: input.placeName, point: r.data.point, current: null, rows: r.data.rows, attribution: r.data.attribution } };
}

export type HourWeatherError = "bad_date" | "too_long" | "out_of_range";
export type HourWeatherResult = { ok: true; data: HourWeather } | { ok: false; reason: string; error?: HourWeatherError };

/** Tối đa 2 ngày mỗi lần (hôm nay + ngày mai cho dải giờ, hoặc một ngày khi xem chi tiết). */
export const HOURS_MAX_DAYS = 2;

/** Kiểm tra khoảng ngày xem theo giờ: dự báo trong 16 ngày tới; đã qua thì trước hôm nay, từ 1940. */
export function validateHoursRange(kind: "forecast" | "history", from: string, to: string, today: string): HourWeatherError | null {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(from) || !re.test(to) || to < from) return "bad_date";
  if (daysBetween(from, to) + 1 > HOURS_MAX_DAYS) return "too_long";
  if (kind === "forecast") {
    if (from < addDays(today, -1) || to > addDays(today, 15)) return "out_of_range";
  } else if (to >= today || from < HISTORY_MIN_DATE) return "out_of_range";
  return null;
}

/** Thời tiết theo giờ (DS-05). Cache: dự báo 1 giờ, đã qua 1 ngày. */
export async function getHourWeather(input: Input & { kind: "forecast" | "history"; from: string; to: string }): Promise<HourWeatherResult> {
  const error = validateHoursRange(input.kind, input.from, input.to, dateGmt7(input.now));
  if (error) return { ok: false, reason: "invalid_range", error };
  const r = await fetchOpenMeteoHours({ ...input, revalidateSeconds: input.kind === "forecast" ? 3600 : 24 * 3600 });
  if (!r.ok) return r;
  return { ok: true, data: { kind: input.kind, placeName: input.placeName, point: r.data.point, from: input.from, to: input.to, rows: r.data.rows, attribution: r.data.attribution } };
}
