import type { SourceId } from "./types";

/** Chu kỳ lấy bản tin theo nguồn (phút) — §5.5: DS-01 = 3h, DS-02 = 6h. */
export const POLL_INTERVAL_MINUTES: Partial<Record<SourceId, number>> = {
  "DS-01": 180,
  "DS-02": 360,
  "DS-03": 360,
  "DS-04": 60,
  "DS-05": 60,
};

/** §5.5 — BR-02: `now − issuedAt > 2 × pollInterval`. `now` nhận qua tham số (A-01). */
export function isStormStale(issuedAt: string, sourceId: SourceId, now: string | Date): boolean {
  const interval = POLL_INTERVAL_MINUTES[sourceId];
  if (interval === undefined) return false;
  const nowMs = typeof now === "string" ? new Date(now).getTime() : now.getTime();
  const ageMs = nowMs - new Date(issuedAt).getTime();
  return ageMs > 2 * interval * 60_000;
}
