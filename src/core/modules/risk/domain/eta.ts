import type { RiskLevel } from "./types";

/**
 * §5.3 — BR-04. Dùng bán kính gió CẤP 6 (không phải cấp 10, GAP-03).
 * null → "—"/"Ngoài vùng"; 'inside' → "Đang trong vùng"; n → "{n} giờ (tham khảo)".
 * Giả định bão tiến thẳng về phía ghe (Q-04) — UI PHẢI kèm nhãn "tham khảo".
 *
 * TODO(BA-BD-002 §12): §5.3 kiểm tra `moveSpeedKmh` trước `d <= galeKm`, nên ghe đang trong vùng cấp 6 của
 * bão đứng yên sẽ hiện "—". Ở đây kiểm tra "trong vùng" trước vì an toàn hơn cho người dùng (§0.4).
 */
export function etaGaleHours(input: {
  level: RiskLevel;
  distanceKm: number | null;
  radiusGaleKm: number | null;
  moveSpeedKmh: number | null;
}): number | "inside" | null {
  const { level, distanceKm: d, radiusGaleKm: galeKm, moveSpeedKmh } = input;
  if (level === "safe" || d === null) return null;
  if (galeKm === null) return null; // nguồn không cung cấp bán kính cấp 6 → không tính (BR-01)
  if (d <= galeKm) return "inside";
  if (moveSpeedKmh === null || moveSpeedKmh <= 0) return null;
  return Math.round((d - galeKm) / moveSpeedKmh);
}
