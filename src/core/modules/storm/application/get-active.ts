import type { Storm } from "@/modules/risk";
import { haversineKm, isStormStale, nowPoint } from "@/modules/risk";
import type { LiveStormSource, StormRepository } from "../domain/ports";
import { compareBulletins } from "../domain/merge";
import { seaRelevance } from "../domain/sea-region";

export interface StormWithMeta {
  storm: Storm;
  /** BR-02 §5.5 — tính với `now` truyền vào. */
  stale: boolean;
  /** Tâm đang trong vùng Biển Đông (SEA_REGION). */
  inSea: boolean;
  /** Dự báo vào vùng Biển Đông lúc (ISO UTC); null nếu không. */
  entersSeaAt: string | null;
}

/** Hai bản tin từ hai nguồn coi là cùng một xoáy thuận khi tâm cách nhau ≤ ngưỡng này (km). */
const SAME_SYSTEM_KM = 300;

function withMeta(storm: Storm, now: string): StormWithMeta {
  const rel = seaRelevance(storm);
  return { storm, stale: isStormStale(storm.stamp.issuedAt, storm.stamp.sourceId, now), inSea: rel.inSea, entersSeaAt: rel.entersSeaAt };
}

/**
 * UC-01/UC-03: bão + áp thấp nhiệt đới đang hoạt động (0..n).
 * Hợp nhất (BA-BD-001 §4.1): bản ghi trong kho (DS-01 nhập tay) là mặc định; nguồn sống (DS-02 JMA) bổ sung
 * các hệ thống chưa có bản tin DS-01 — với `isFallback` do nguồn sống tự gắn. Lệch tâm > 80 km / ≥ 2 cấp → log `source_divergence`.
 * Trả TẤT CẢ hệ thống (kể cả ngoài Biển Đông) kèm cờ `inSea`/`entersSeaAt`; caller lọc theo nhu cầu.
 */
export async function getActiveStorms(repo: StormRepository, now: string, live?: LiveStormSource | null): Promise<StormWithMeta[]> {
  const stored = await repo.listActive();
  const out: Storm[] = [...stored];

  if (live) {
    const r = await live.fetchLive(new Date(now));
    if (r.ok) {
      for (const s of r.storms) {
        const c = nowPoint(s);
        const twin = c ? stored.find((b) => {
          const bc = nowPoint(b);
          return bc !== null && haversineKm(bc, c) <= SAME_SYSTEM_KM;
        }) : undefined;
        if (twin) {
          const d = compareBulletins(twin, s);
          if (d.diverged) console.warn("[storm] source_divergence", { stored: twin.id, live: s.id, ...d });
          continue; // DS-01 thắng
        }
        out.push(s);
      }
    } else {
      console.warn(`[storm] nguồn sống ${live.sourceId} không dùng được: ${r.reason}`);
    }
  }

  return out.filter((s) => s.status !== "dissipated").map((s) => withMeta(s, now));
}

export async function getStormById(repo: StormRepository, id: string, now: string, live?: LiveStormSource | null): Promise<StormWithMeta | null> {
  const stored = await repo.getById(id);
  if (stored) return withMeta(stored, now);
  if (!live) return null;
  const all = await getActiveStorms(repo, now, live);
  return all.find((s) => s.storm.id === id || s.storm.stormKey === id) ?? null;
}
