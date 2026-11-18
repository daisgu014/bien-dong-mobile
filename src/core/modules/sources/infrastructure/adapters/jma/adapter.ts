// Adapter DS-02 JMA (RSMC Tokyo): bão + áp thấp nhiệt đới có bản tin. Chuyển đổi đơn vị → `modified: true`.
// Bán kính gió theo ngưỡng 30 kt / 50 kt của JMA — KHÔNG phải cấp 6/10 (units.md). Gió trung bình 10 phút.
import { degreesToCompassEn, toBeaufortVn } from "@/shared/format/units";
import type { SourceDefinition } from "../../../domain/registry-schema";
import type { NormalizedStormSnapshot, SnapshotTrackPoint, StormSystemType } from "../../../domain/storm-snapshot";
import { JmaForecastSchema, JmaSpecificationsSchema, JmaTargetTcSchema, type JmaForecast, type JmaSpecPart, type JmaSpecifications, type JmaTargetTc } from "./schema";

export const JMA_BASE = "https://www.jma.go.jp/bosai/typhoon/data";
/** Trang người dùng xem được (ghi nguồn trỏ tới đây theo yêu cầu "URL of relevant page"). */
export const JMA_PAGE_URL = "https://www.jma.go.jp/bosai/map.html#contents=typhoon";

export const jmaTargetUrl = () => `${JMA_BASE}/targetTc.json`;
export const jmaSpecificationsUrl = (tcId: string) => `${JMA_BASE}/${encodeURIComponent(tcId)}/specifications.json`;
export const jmaForecastUrl = (tcId: string) => `${JMA_BASE}/${encodeURIComponent(tcId)}/forecast.json`;

function fail(what: string, issue: string | undefined): never {
  throw new Error(`JMA ${what}: payload sai schema — ${issue ?? "unknown"}`);
}

export function parseJmaTargetTc(raw: unknown): JmaTargetTc {
  const r = JmaTargetTcSchema.safeParse(raw);
  return r.success ? r.data : fail("targetTc", r.error.issues[0]?.message);
}
export function parseJmaSpecifications(raw: unknown): JmaSpecifications {
  const r = JmaSpecificationsSchema.safeParse(raw);
  return r.success ? r.data : fail("specifications", r.error.issues[0]?.message);
}
export function parseJmaForecast(raw: unknown): JmaForecast {
  const r = JmaForecastSchema.safeParse(raw);
  return r.success ? r.data : fail("forecast", r.error.issues[0]?.message);
}

const num = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v.trim());
    return v.trim() === "" || v.trim() === "-" || !Number.isFinite(n) ? null : n;
  }
  return null;
};

/** Lớn nhất trong các hướng (units.md: dùng giá trị lớn nhất, an toàn hơn). Thiếu → null. */
function maxRangeKm(list: JmaSpecPart["galeWarning"]): number | null {
  if (!list || list.length === 0) return null;
  const kms = list.map((r) => num(r.range?.km)).filter((k): k is number => k !== null);
  return kms.length ? Math.max(...kms) : null;
}

const CATEGORIES: Record<string, StormSystemType> = { TY: "TY", STS: "STS", TS: "TS", TD: "TD", LOW: "LOW" };
export function systemTypeOf(en: string | null | undefined): StormSystemType {
  return (en ? CATEGORIES[en.toUpperCase()] : undefined) ?? "unknown";
}

/** Hướng tiếng Nhật (北北東…) → độ; "ほとんど停滞"/null → null. */
export function jpCourseToDegrees(course: string | null | undefined): number | null {
  if (!course) return null;
  const s = course.replace(/\s/g, "");
  const map: Record<string, number> = {
    北: 0, 北北東: 22.5, 北東: 45, 東北東: 67.5, 東: 90, 東南東: 112.5, 南東: 135, 南南東: 157.5,
    南: 180, 南南西: 202.5, 南西: 225, 西南西: 247.5, 西: 270, 西北西: 292.5, 北西: 315, 北北西: 337.5,
  };
  return s in map ? (map[s] as number) : null;
}

const VN_DIR: Record<string, string> = {
  N: "Bắc", NNE: "Bắc Đông Bắc", NE: "Đông Bắc", ENE: "Đông Đông Bắc", E: "Đông", ESE: "Đông Đông Nam", SE: "Đông Nam", SSE: "Nam Đông Nam",
  S: "Nam", SSW: "Nam Tây Nam", SW: "Tây Nam", WSW: "Tây Tây Nam", W: "Tây", WNW: "Tây Tây Bắc", NW: "Tây Bắc", NNW: "Bắc Tây Bắc",
};

const CODE_VN: Record<StormSystemType, string> = {
  TY: "BÃO",
  STS: "BÃO",
  TS: "BÃO",
  TD: "ÁP THẤP NHIỆT ĐỚI",
  LOW: "VÙNG ÁP THẤP",
  unknown: "XOÁY THUẬN NHIỆT ĐỚI",
};

function pointOf(p: JmaSpecPart, kind: SnapshotTrackPoint["kind"]): SnapshotTrackPoint | null {
  const deg = p.position?.deg;
  const at = p.validtime?.UTC;
  if (!deg || deg.length < 2 || !at) return null;
  const [lat, lon] = deg;
  if (lat === undefined || lon === undefined) return null;
  const ms = num(p.maximumWind?.sustained?.["m/s"]);
  return {
    at: new Date(at).toISOString(),
    kind,
    lat,
    lon,
    category: ms === null ? null : toBeaufortVn(ms),
    radiusGaleKm: maxRangeKm(p.galeWarning),
    radiusStormKm: maxRangeKm(p.stormWarning),
  };
}

/**
 * Chuẩn hoá một xoáy thuận từ specifications + forecast. Trường thiếu → null.
 * Đường đi quá khứ của JMA không có giờ → `pastPositions` (chỉ vẽ), không tạo điểm `past` có giờ giả.
 */
export function normalizeJmaStorm(
  def: SourceDefinition,
  target: JmaTargetTc[number],
  spec: JmaSpecifications,
  forecast: JmaForecast | null,
  meta: { fetchedAt: string; isFallback: boolean },
): NormalizedStormSnapshot | null {
  const title = spec.find((p) => p.part === "title");
  const parts = spec.filter((p) => p.part !== "title");
  const analysis = parts.find((p) => p.advancedHours === 0) ?? null;
  if (!title || !analysis) return null;

  const issuedAt = title.issue?.UTC ? new Date(title.issue.UTC).toISOString() : target.issue ? new Date(target.issue).toISOString() : null;
  if (!issuedAt) return null;

  const now = pointOf(analysis, "now");
  if (!now) return null;
  const forecasts = parts
    .filter((p) => (p.advancedHours ?? 0) > 1) // bỏ "ước tính 1 giờ sau" — không phải dự báo chính thức theo mốc
    .map((p) => pointOf(p, "forecast"))
    .filter((p): p is SnapshotTrackPoint => p !== null);

  const systemType = systemTypeOf(analysis.category?.en ?? title.category?.en ?? target.category);
  const nameIntl = (title.name?.en ?? target.tropicalCyclone).toUpperCase();
  const gustMs = num(analysis.maximumWind?.gust?.["m/s"]);
  const courseDeg = jpCourseToDegrees(analysis.course);
  const moveDirEn = degreesToCompassEn(courseDeg);
  const speedKmh = num(analysis.speed?.["km/h"]);

  const track0 = forecast?.find((p) => p.track)?.track ?? null;
  const pastPositions = [...(track0?.preTyphoon ?? []), ...(track0?.typhoon ?? [])]
    .map(([lat, lon]) => (lat !== undefined && lon !== undefined ? { lat, lon } : null))
    .filter((p): p is { lat: number; lon: number } => p !== null);

  const stormKey = `jma:${target.tropicalCyclone}`;
  return {
    id: `${stormKey}:${issuedAt}`,
    stormKey,
    systemType,
    codeVn: CODE_VN[systemType],
    nameVn: nameIntl, // JMA không có tên tiếng Việt; tên trong nước chỉ từ DS-01 (BR-11)
    nameIntl,
    status: systemType === "LOW" ? "weakening" : "active",
    category: now.category,
    gust: gustMs === null ? null : toBeaufortVn(gustMs),
    pressureHpa: num(analysis.pressure),
    moveSpeedKmh: speedKmh,
    moveDirVn: moveDirEn ? (VN_DIR[moveDirEn] ?? null) : null,
    moveDirEn,
    radiusGaleKm: now.radiusGaleKm,
    radiusStormKm: now.radiusStormKm,
    radiusThresholdKt: { gale: 30, storm: 50 },
    windAveragingMinutes: def.windAveragingMinutes,
    landfall: null,
    track: [now, ...forecasts],
    pastPositions,
    cone24h: null, // JMA cho vòng xác suất từng mốc, không phải polygon phễu — TODO(BA-BD-002 §13 Q-06)
    stamp: {
      sourceId: def.id,
      sourceName: def.shortName === "JMA" ? "RSMC Tokyo — JMA" : def.name,
      issuedAt,
      fetchedAt: meta.fetchedAt,
      isFallback: meta.isFallback,
      sourceUrl: JMA_PAGE_URL,
      modified: true, // đã quy đổi m/s → cấp Beaufort VN, hướng JP → EN/VN
    },
  };
}
