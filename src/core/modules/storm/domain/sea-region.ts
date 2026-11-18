import type { Storm, StormTrackPoint } from "@/modules/risk";
import { nowPoint } from "@/modules/risk";

/**
 * Vùng "Biển Đông" để lọc hệ thống liên quan = khung nhìn "wide" §8.2 (bao trùm vùng dự báo QĐ 18/2021: 5–23°N, phía Tây 120°E).
 * Hệ thống ở ngoài nhưng dự báo đi vào vùng này vẫn được liệt kê ("sắp tới").
 */
export const SEA_REGION = { west: 100, south: 1, east: 128, north: 25 } as const;

export function inSeaRegion(p: { lat: number; lon: number }): boolean {
  return p.lon >= SEA_REGION.west && p.lon <= SEA_REGION.east && p.lat >= SEA_REGION.south && p.lat <= SEA_REGION.north;
}

export interface SeaRelevance {
  /** Tâm hiện tại đang trong vùng. */
  inSea: boolean;
  /** Mốc dự báo đầu tiên (ISO UTC) tâm bão vào vùng; null nếu không có. */
  entersSeaAt: string | null;
  /** inSea || entersSeaAt !== null */
  relevant: boolean;
}

export function seaRelevance(storm: Storm): SeaRelevance {
  const now = nowPoint(storm);
  const inSea = now ? inSeaRegion(now) : false;
  const first = storm.track.filter((p): p is StormTrackPoint => p.kind === "forecast" && inSeaRegion(p)).sort((a, b) => a.at.localeCompare(b.at))[0];
  const entersSeaAt = !inSea && first ? first.at : null;
  return { inSea, entersSeaAt, relevant: inSea || entersSeaAt !== null };
}
