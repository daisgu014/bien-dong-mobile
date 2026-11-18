import type { RiskLevel, VesselWithRisk } from "./types";

export const LEVEL_ORDER: Record<RiskLevel, number> = { danger: 0, warn: 1, watch: 2, safe: 3 };

/** §5.4 — mức giảm dần, cùng mức thì khoảng cách tăng dần, cùng khoảng cách thì theo regNo. Không mutate. */
export function sortVessels<T extends VesselWithRisk>(vessels: readonly T[]): T[] {
  return [...vessels].sort((a, b) => {
    const byLevel = LEVEL_ORDER[a.risk.level] - LEVEL_ORDER[b.risk.level];
    if (byLevel !== 0) return byLevel;
    const da = a.risk.distanceKm ?? Number.POSITIVE_INFINITY;
    const db = b.risk.distanceKm ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    return a.regNo.localeCompare(b.regNo, "vi");
  });
}

export type BucketCounts = Record<RiskLevel, number>;

/** §5.4 — bộ đếm phân mức; ghe `paused` không tính. */
export function bucketCounts(vessels: readonly VesselWithRisk[]): BucketCounts {
  const counts: BucketCounts = { danger: 0, warn: 0, watch: 0, safe: 0 };
  for (const v of vessels) {
    if (v.status === "paused") continue;
    counts[v.risk.level] += 1;
  }
  return counts;
}

/** §5.4 — số ghe "trong vùng ảnh hưởng" = danger + warn (Q-03: không tính THEO DÕI). */
export function affectedCount(vessels: readonly VesselWithRisk[]): number {
  const c = bucketCounts(vessels);
  return c.danger + c.warn;
}

export type StatusSummary = { kind: "no_storm" } | { kind: "none" } | { kind: "affected"; n: number };

/** Băng trạng thái (§5.4). */
export function statusSummary(hasStorm: boolean, vessels: readonly VesselWithRisk[]): StatusSummary {
  if (!hasStorm) return { kind: "no_storm" };
  const n = affectedCount(vessels);
  return n > 0 ? { kind: "affected", n } : { kind: "none" };
}
