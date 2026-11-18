import { assessVessel } from "./assess";
import type { Storm, StormTrackPoint, Vessel, VesselWithRisk } from "./types";

/** Một mốc trên thanh thời gian: "hiện tại" hoặc một điểm dự báo DO NGUỒN CUNG CẤP (không nội suy, BR-01). */
export interface ForecastStep {
  at: string; // ISO UTC
  kind: "now" | "forecast";
  /** Số giờ kể từ điểm "now" của bản tin (làm tròn), vd 24 → "+24h". */
  offsetHours: number;
  category: number | null;
}

/** Danh sách mốc: điểm "now" rồi các điểm dự báo theo thời gian tăng dần. Không có "now" → rỗng. */
export function forecastSteps(storm: Storm | null): ForecastStep[] {
  if (!storm) return [];
  const now = storm.track.find((p) => p.kind === "now");
  if (!now) return [];
  const nowMs = new Date(now.at).getTime();
  const forecast = storm.track
    .filter((p) => p.kind === "forecast" && new Date(p.at).getTime() > nowMs)
    .sort((a, b) => a.at.localeCompare(b.at));
  return [now, ...forecast].map((p) => ({
    at: p.at,
    kind: p.kind === "now" ? "now" : "forecast",
    offsetHours: Math.round((new Date(p.at).getTime() - nowMs) / 3_600_000),
    category: p.category,
  }));
}

/**
 * Ảnh chụp bão tại một điểm dự báo của nguồn: điểm đó thành "now", các điểm trước nó thành "past".
 * Chỉ giữ giá trị nguồn cho tại ĐIỂM ĐÓ (vị trí, cấp gió, bán kính). Trường nguồn không cho theo điểm
 * (giật, áp suất, tốc độ/hướng di chuyển, phễu 24h) → null — KHÔNG mượn giá trị hiện tại, KHÔNG nội suy (BR-01).
 * `at` không khớp điểm dự báo nào (hoặc là điểm "now") → trả nguyên bão.
 */
export function stormAtStep(storm: Storm, at: string | null): Storm {
  if (at === null) return storm;
  const target = storm.track.find((p) => p.kind === "forecast" && p.at === at);
  if (!target) return storm;
  const targetMs = new Date(target.at).getTime();
  const track: StormTrackPoint[] = storm.track.map((p) => {
    if (p === target) return { ...p, kind: "now" };
    const ms = new Date(p.at).getTime();
    if (p.kind === "past" || ms < targetMs) return { ...p, kind: "past" };
    return p;
  });
  return {
    ...storm,
    category: target.category,
    gust: null,
    pressureHpa: null,
    moveSpeedKmh: null,
    moveDirVn: null,
    moveDirEn: null,
    radiusGaleKm: target.radiusGaleKm,
    radiusStormKm: target.radiusStormKm,
    cone24h: null,
    track,
  };
}

/**
 * Mức nguy hiểm của ghe nếu bão ở điểm dự báo `at`, GIẢ ĐỊNH ghe giữ nguyên vị trí hiện tại.
 * Tuổi vị trí (BR-07) vẫn tính theo `now` thật. Đây là số liệu ứng dụng tự tính (tham khảo), không phải của nguồn.
 */
export function assessAtStep<V extends Vessel>(vessels: readonly V[], storm: Storm, at: string | null, now: string): Array<V & { risk: VesselWithRisk["risk"] }> {
  const snapshot = stormAtStep(storm, at);
  return vessels.map((v) => ({ ...v, risk: assessVessel(v, snapshot, now) }));
}
