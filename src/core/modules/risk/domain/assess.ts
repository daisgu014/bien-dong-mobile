import { applyPositionAge, classify } from "./classify";
import { haversineKm, pointInPolygon } from "./distance";
import { etaGaleHours } from "./eta";
import type { RiskAssessment, RiskFlag, Storm, StormTrackPoint, Vessel } from "./types";

export function nowPoint(storm: Storm | null): StormTrackPoint | null {
  if (!storm) return null;
  return storm.track.find((p) => p.kind === "now") ?? null;
}

/**
 * Gộp §5.1 → §5.3 thành một `RiskAssessment` cho một ghe với bão chính.
 * Hàm thuần: `now` là tham số (A-01, CLAUDE.md quy tắc 8).
 */
export function assessVessel(vessel: Vessel, storm: Storm | null, now: string): RiskAssessment {
  const pos = vessel.lastPosition;
  const center = nowPoint(storm);
  const positionAgeMinutes = pos ? Math.max(0, Math.floor((new Date(now).getTime() - new Date(pos.at).getTime()) / 60_000)) : 0;

  const distanceKm = pos && center ? haversineKm(pos, center) : null;

  const base = classify({
    distanceKm,
    radiusGaleKm: storm?.radiusGaleKm ?? null,
    radiusStormKm: storm?.radiusStormKm ?? null,
    inCone24h: pos ? pointInPolygon(pos, storm?.cone24h ?? null) : false,
    userThresholdKm: vessel.thresholdKm ?? null,
    stormStatus: storm?.status ?? null,
  });
  const aged = applyPositionAge(base, positionAgeMinutes);

  const flags: RiskFlag[] = [];
  if (pos?.confidence === "unverified") flags.push("unverified");
  for (const f of aged.flags) if (!flags.includes(f)) flags.push(f);
  if (vessel.status === "lost_signal") flags.push("lost_signal");

  return {
    vesselId: vessel.id,
    stormId: storm && storm.status !== "dissipated" ? storm.id : null,
    computedAt: now,
    distanceKm,
    level: aged.level,
    levelReason: aged.reason,
    etaGaleHours: etaGaleHours({
      level: aged.level,
      distanceKm,
      radiusGaleKm: storm?.radiusGaleKm ?? null,
      moveSpeedKmh: storm?.moveSpeedKmh ?? null,
    }),
    positionAgeMinutes,
    flags,
    basedOnPositionAt: pos?.at ?? now,
  };
}

/**
 * §6 "Chọn bão chính": bão gần ghe nguy hiểm nhất; không có ghe trong vùng → bão có cấp gió lớn nhất.
 * Quyết định tạm — TODO(BA-BD-002 §13 Q-02).
 */
export function pickPrimaryStorm(storms: readonly Storm[], vessels: readonly Vessel[], now: string): Storm | null {
  const active = storms.filter((s) => s.status !== "dissipated");
  if (active.length === 0) return null;
  if (active.length === 1) return active[0] ?? null;

  let best: { storm: Storm; rank: number; distance: number } | null = null;
  for (const storm of active) {
    for (const v of vessels) {
      const a = assessVessel(v, storm, now);
      if (a.level === "danger" || a.level === "warn") {
        const rank = a.level === "danger" ? 0 : 1;
        const distance = a.distanceKm ?? Number.POSITIVE_INFINITY;
        if (!best || rank < best.rank || (rank === best.rank && distance < best.distance)) best = { storm, rank, distance };
      }
    }
  }
  if (best) return best.storm;

  return [...active].sort((a, b) => (b.category ?? -1) - (a.category ?? -1))[0] ?? null;
}
