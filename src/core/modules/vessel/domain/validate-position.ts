import { z } from "zod";
import { haversineKm, type VesselPosition } from "@/modules/risk";

/**
 * BR-08 (BA-BD-001 §7): validate toạ độ nhập tay — vĩ độ 0–25°N, kinh độ 99–125°E;
 * thời điểm không ở tương lai và không cũ hơn 72 giờ. Ngoài phạm vi thì từ chối kèm khoảng hợp lệ (UC-07 tiêu chí chấp nhận).
 */
export const ManualPositionInputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  at: z.iso.datetime({ offset: true }),
  speedKn: z.number().min(0).max(60).nullable().optional(),
  courseDeg: z.number().min(0).max(360).nullable().optional(),
});
export type ManualPositionInput = z.infer<typeof ManualPositionInputSchema>;

export const SEA_BOUNDS = { west: 99, south: 0, east: 125, north: 25 } as const;
export const MAX_MANUAL_AGE_HOURS = 72;
/** BR-08: tốc độ suy ra giữa hai điểm liên tiếp vượt ngưỡng này → nghi nhập sai, yêu cầu xác nhận. */
export const MAX_IMPLIED_SPEED_KN = 20;

export type PositionValidation = { ok: true; value: ManualPositionInput } | { ok: false; errors: string[] };

export function validateManualPosition(raw: unknown, now: Date): PositionValidation {
  const parsed = ManualPositionInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  const v = parsed.data;
  const errors: string[] = [];
  if (v.lon < SEA_BOUNDS.west || v.lon > SEA_BOUNDS.east || v.lat < SEA_BOUNDS.south || v.lat > SEA_BOUNDS.north) {
    errors.push(`Toạ độ nằm ngoài vùng Biển Đông (vĩ độ ${SEA_BOUNDS.south}–${SEA_BOUNDS.north}°N, kinh độ ${SEA_BOUNDS.west}–${SEA_BOUNDS.east}°E)`);
  }
  const atMs = new Date(v.at).getTime();
  if (atMs > now.getTime() + 5 * 60_000) errors.push("Thời điểm không được ở tương lai");
  if (now.getTime() - atMs > MAX_MANUAL_AGE_HOURS * 3_600_000) errors.push(`Thời điểm cũ hơn ${MAX_MANUAL_AGE_HOURS} giờ`);
  return errors.length ? { ok: false, errors } : { ok: true, value: v };
}

const KM_PER_NM = 1.852;

/**
 * BR-08 / UC-07 2b: tốc độ (hải lý/giờ) suy ra giữa điểm trước và điểm mới. `null` khi không có điểm trước.
 * Hai điểm cùng thời điểm mà lệch chỗ → Infinity (chắc chắn nghi sai).
 */
export function impliedSpeedKn(prev: Pick<VesselPosition, "lat" | "lon" | "at"> | null, next: { lat: number; lon: number; at: string }): number | null {
  if (!prev) return null;
  const km = haversineKm(prev, next);
  const hours = Math.abs(new Date(next.at).getTime() - new Date(prev.at).getTime()) / 3_600_000;
  if (hours === 0) return km < 0.5 ? 0 : Number.POSITIVE_INFINITY;
  return km / KM_PER_NM / hours;
}
