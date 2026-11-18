import { evaluateSource, type SourcePolicyEnv } from "../domain/policy";
import { fetchFromSource, getCached } from "../infrastructure/http-client";
import { roundPoint } from "../infrastructure/adapters/open-meteo/adapter";
import {
  normalizeDaily,
  normalizeHourlyDay,
  openMeteoHourlyUrl,
  parseOpenMeteoHourlyDay,
  type HoursNormalized,
  normalizeSeasonalWeekly,
  openMeteoArchiveUrl,
  openMeteoDailyForecastUrl,
  openMeteoSeasonalUrl,
  parseOpenMeteoDaily,
  parseOpenMeteoSeasonal,
  type DailyNormalized,
  type OutlookNormalized,
} from "../infrastructure/adapters/open-meteo/daily";
import { normalizeMarineDaily, openMeteoMarineDailyUrl, parseOpenMeteoMarineDaily, type MarineDailyNormalized } from "../infrastructure/adapters/open-meteo/marine-daily";
import { getSource } from "../registry";

export type OpenMeteoDailyResult = { ok: true; data: DailyNormalized } | { ok: false; reason: string };
export type OpenMeteoHoursResult = { ok: true; data: HoursNormalized } | { ok: false; reason: string };
export type OpenMeteoOutlookResult = { ok: true; data: OutlookNormalized } | { ok: false; reason: string };

interface Common {
  lat: number;
  lon: number;
  policyEnv: SourcePolicyEnv;
  contactEmail: string;
  /** TTL Data Cache của Next (giây). Bỏ trống trong test → dùng cache bộ nhớ + giới hạn tần suất của http-client. */
  revalidateSeconds?: number;
}

async function getBody(url: string, input: Common): Promise<{ body: string; fetchedAt: string } | { reason: string }> {
  const def = getSource("DS-05");
  const verdict = evaluateSource(def, input.policyEnv);
  if (!verdict.usable) return { reason: verdict.reason };
  const res = await fetchFromSource(def, url, {
    contactEmail: input.contactEmail,
    backoffMs: [],
    ...(input.revalidateSeconds ? { revalidateSeconds: input.revalidateSeconds } : {}),
  });
  const body = res.body ?? getCached(def, url)?.body ?? null;
  if (body === null) return { reason: "không có dữ liệu" };
  return { body, fetchedAt: res.fetchedAt };
}

/** DS-05: dự báo theo ngày 16 ngày tại một điểm (tab DỰ BÁO). */
export async function fetchOpenMeteoDailyForecast(input: Common): Promise<OpenMeteoDailyResult> {
  const p = roundPoint(input.lat, input.lon);
  const url = openMeteoDailyForecastUrl(p.lat, p.lon);
  const r = await getBody(url, input);
  if ("reason" in r) return { ok: false, reason: r.reason };
  return { ok: true, data: normalizeDaily(getSource("DS-05"), parseOpenMeteoDaily(JSON.parse(r.body) as unknown), { fetchedAt: r.fetchedAt, sourceUrl: url }) };
}

/** DS-05: thời tiết đã qua (Historical Weather API — tái phân tích ERA5 + mô hình), khoảng ngày GMT+7 [from, to]. */
export async function fetchOpenMeteoArchive(input: Common & { from: string; to: string }): Promise<OpenMeteoDailyResult> {
  const p = roundPoint(input.lat, input.lon);
  const url = openMeteoArchiveUrl(p.lat, p.lon, input.from, input.to);
  const r = await getBody(url, input);
  if ("reason" in r) return { ok: false, reason: r.reason };
  return { ok: true, data: normalizeDaily(getSource("DS-05"), parseOpenMeteoDaily(JSON.parse(r.body) as unknown), { fetchedAt: r.fetchedAt, sourceUrl: url }) };
}

/** DS-05: xu hướng theo tuần (Seasonal API, ECMWF EC46) cho khoảng ngày GMT+7 [from, to]. */
export async function fetchOpenMeteoOutlook(input: Common & { from: string; to: string }): Promise<OpenMeteoOutlookResult> {
  const p = roundPoint(input.lat, input.lon);
  const url = openMeteoSeasonalUrl(p.lat, p.lon, input.from, input.to);
  const r = await getBody(url, input);
  if ("reason" in r) return { ok: false, reason: r.reason };
  return { ok: true, data: normalizeSeasonalWeekly(getSource("DS-05"), parseOpenMeteoSeasonal(JSON.parse(r.body) as unknown), { fetchedAt: r.fetchedAt, sourceUrl: url }) };
}

/** DS-05: thời tiết theo giờ trong các ngày GMT+7 [from, to] — dự báo (Forecast API) hoặc đã qua (archive). */
export async function fetchOpenMeteoHours(input: Common & { kind: "forecast" | "history"; from: string; to: string }): Promise<OpenMeteoHoursResult> {
  const p = roundPoint(input.lat, input.lon);
  const url = openMeteoHourlyUrl(input.kind, p.lat, p.lon, input.from, input.to);
  const r = await getBody(url, input);
  if ("reason" in r) return { ok: false, reason: r.reason };
  return { ok: true, data: normalizeHourlyDay(getSource("DS-05"), parseOpenMeteoHourlyDay(JSON.parse(r.body) as unknown), { fetchedAt: r.fetchedAt, sourceUrl: url }) };
}

export type OpenMeteoMarineDailyResult = { ok: true; data: MarineDailyNormalized } | { ok: false; reason: string };

/** DS-05: sóng theo ngày (Marine API) tại một điểm biển, 7 ngày tới. */
export async function fetchOpenMeteoMarineDaily(input: Common): Promise<OpenMeteoMarineDailyResult> {
  const p = roundPoint(input.lat, input.lon);
  const url = openMeteoMarineDailyUrl(p.lat, p.lon);
  const r = await getBody(url, input);
  if ("reason" in r) return { ok: false, reason: r.reason };
  return { ok: true, data: normalizeMarineDaily(getSource("DS-05"), parseOpenMeteoMarineDaily(JSON.parse(r.body) as unknown), { fetchedAt: r.fetchedAt, sourceUrl: url }) };
}
