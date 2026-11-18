import type { Storm } from "@/modules/risk";
import { haversineKm, nowPoint } from "@/modules/risk";

/** Ngưỡng ghi log `source_divergence` (BA-BD-001 §4.1). */
export const DIVERGENCE_CENTER_KM = 80;
export const DIVERGENCE_CATEGORY = 2;

/** DS-01 lỗi liên tiếp từ mức này thì chuyển DS-02 và bật `isFallback`. */
export const FALLBACK_AFTER_FAILURES = 2;

export function shouldUseFallback(primaryConsecutiveFailures: number): boolean {
  return primaryConsecutiveFailures >= FALLBACK_AFTER_FAILURES;
}

export interface Divergence {
  centerKm: number | null;
  categoryDiff: number | null;
  diverged: boolean;
}

/** So hai bản tin cùng một cơn bão từ hai nguồn — chỉ để ghi log, không tự chọn giá trị "đúng". */
export function compareBulletins(a: Storm, b: Storm): Divergence {
  const pa = nowPoint(a);
  const pb = nowPoint(b);
  const centerKm = pa && pb ? haversineKm(pa, pb) : null;
  const categoryDiff = a.category !== null && b.category !== null ? Math.abs(a.category - b.category) : null;
  const diverged = (centerKm !== null && centerKm > DIVERGENCE_CENTER_KM) || (categoryDiff !== null && categoryDiff >= DIVERGENCE_CATEGORY);
  return { centerKm, categoryDiff, diverged };
}

/** Giữ bản tin mới nhất cho mỗi cơn bão (theo issuedAt), bỏ bão đã tan. */
export function latestPerStorm(bulletins: readonly Storm[], keyOf: (s: Storm) => string): Storm[] {
  const map = new Map<string, Storm>();
  for (const s of bulletins) {
    const k = keyOf(s);
    const cur = map.get(k);
    if (!cur || new Date(s.stamp.issuedAt).getTime() > new Date(cur.stamp.issuedAt).getTime()) map.set(k, s);
  }
  return [...map.values()].filter((s) => s.status !== "dissipated");
}
