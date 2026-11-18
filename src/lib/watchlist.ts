// Tính mức nguy hiểm cho ghe trên điện thoại bằng CHÍNH risk-engine thuần của web (A-01: một cài đặt cho mọi nền tảng).
import {
  assessVessel,
  bucketCounts,
  pickPrimaryStorm,
  sortVessels,
  statusSummary,
  type BucketCounts,
  type StatusSummary,
  type Storm,
  type Vessel,
  type VesselWithRisk,
} from "@/modules/risk";

export interface Watchlist {
  primary: Storm | null;
  /** Đã sắp §5.4; ghe tạm dừng xuống cuối (S-06). */
  vessels: VesselWithRisk[];
  /** §5.4: không tính ghe tạm dừng. */
  counts: BucketCounts;
  summary: StatusSummary;
}

/**
 * @param thresholdKm BR-21 — ngưỡng chung từ Cài đặt, chỉ áp cho ghe chưa có ngưỡng riêng; chỉ mở rộng mức THEO DÕI.
 */
export function buildWatchlist(storms: readonly Storm[], vessels: readonly Vessel[], now: string, thresholdKm: number | null): Watchlist {
  const withThreshold = vessels.map((v) => (v.thresholdKm == null && thresholdKm != null ? { ...v, thresholdKm } : v));
  const active = withThreshold.filter((v) => v.status !== "paused");
  const primary = pickPrimaryStorm(storms, active, now);
  const assessed = withThreshold.map((v) => ({ ...v, risk: assessVessel(v, primary, now) }));
  const tracked = sortVessels(assessed.filter((v) => v.status !== "paused"));
  const paused = sortVessels(assessed.filter((v) => v.status === "paused"));
  return {
    primary,
    vessels: [...tracked, ...paused],
    counts: bucketCounts(tracked),
    summary: statusSummary(primary !== null, tracked),
  };
}
