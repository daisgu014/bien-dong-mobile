import type { LevelReason, RiskFlag, RiskLevel, Storm } from "./types";

/** Vùng đệm "rìa vùng ảnh hưởng" cộng thêm ngoài bán kính cấp 6 (§5.2). */
export const NEAR_GALE_BUFFER_KM = 220;

/** Tuổi vị trí (giờ) vượt mức này thì `danger` hạ thành `warn` (BR-07). */
export const TOO_OLD_FOR_DANGER_HOURS = 12;
/** Tuổi vị trí (giờ) vượt mức này thì gắn cờ `stale`. */
export const STALE_POSITION_HOURS = 6;

export interface ClassifyInput {
  distanceKm: number | null;
  radiusGaleKm: number | null;
  radiusStormKm: number | null;
  inCone24h: boolean;
  userThresholdKm: number | null;
  stormStatus: Storm["status"] | null; // null = không có bão
}

export interface Classification {
  level: RiskLevel;
  reason: LevelReason;
}

/**
 * §5.2 — BR-03, BR-07, BR-21. Biên so sánh dùng `<=`.
 * Nguồn thiếu bán kính thì bỏ nhánh tương ứng — KHÔNG ước lượng (BR-01).
 */
export function classify(input: ClassifyInput): Classification {
  const { distanceKm: d, radiusGaleKm: galeKm, radiusStormKm: stormKm, inCone24h, userThresholdKm, stormStatus } = input;

  if (stormStatus === null || stormStatus === "dissipated" || d === null) {
    return { level: "safe", reason: "no_storm" };
  }
  if (stormKm !== null && d <= stormKm) return { level: "danger", reason: "in_storm_radius" };
  if (galeKm !== null && d <= galeKm) return { level: "warn", reason: "in_gale_radius" };
  if (galeKm !== null && d <= galeKm + NEAR_GALE_BUFFER_KM) return { level: "watch", reason: "near_gale" };
  if (inCone24h) return { level: "watch", reason: "in_cone_24h" };
  // BR-21: ngưỡng người dùng chỉ MỞ RỘNG mức THEO DÕI, không bao giờ hạ mức.
  if (userThresholdKm !== null && d <= userThresholdKm) return { level: "watch", reason: "near_gale" };
  return { level: "safe", reason: "outside" };
}

/** BR-07: vị trí quá cũ thì không được phát NGUY HIỂM. Trả về mức đã hạ và cờ bổ sung. */
export function applyPositionAge(
  c: Classification,
  positionAgeMinutes: number,
): { level: RiskLevel; reason: LevelReason; flags: RiskFlag[] } {
  const flags: RiskFlag[] = [];
  if (positionAgeMinutes > STALE_POSITION_HOURS * 60) flags.push("stale");
  if (c.level === "danger" && positionAgeMinutes > TOO_OLD_FOR_DANGER_HOURS * 60) {
    flags.push("too_old_for_danger");
    return { level: "warn", reason: c.reason, flags };
  }
  return { level: c.level, reason: c.reason, flags };
}
