// Adapter DS-04 GDACS: chỉ PHÁT HIỆN sự kiện bão trong vùng Biển Đông. Không lấy thông số để phân mức.
import { makeAttribution } from "../../../domain/attribution";
import type { Attribution, SourceDefinition } from "../../../domain/registry-schema";
import { GdacsEventListSchema, type GdacsFeature } from "./schema";

export const GDACS_BASE = "https://www.gdacs.org/gdacsapi/api";

/** Bbox phát hiện = khung nhìn "wide" §8.2 (bao trùm vùng dự báo QĐ 18/2021: 5–23°N, phía Tây 120°E). */
export const SEA_DETECT_BBOX = { west: 100, south: 1, east: 128, north: 25 } as const;

export interface StormEventDetected {
  externalId: string; // "gdacs:1001305"
  episodeId: string | null;
  nameIntl: string | null;
  alertLevel: "Green" | "Orange" | "Red" | null;
  isCurrent: boolean;
  centroid: { lat: number; lon: number } | null;
  fromDate: string | null; // ISO UTC
  toDate: string | null;
  modifiedAt: string | null;
  /** Tốc độ gió lớn nhất theo GDACS (km/h). Chỉ để tham khảo, KHÔNG dùng phân mức. */
  maxWindKmh: number | null;
  reportUrl: string | null;
  attribution: Attribution;
}

export function gdacsSearchUrl(fromDate: string, toDate: string): string {
  const q = new URLSearchParams({ eventlist: "TC", fromDate, toDate, alertlevel: "Green;Orange;Red" });
  return `${GDACS_BASE}/events/geteventlist/SEARCH?${q.toString()}`;
}

/** GDACS trả giờ dạng "2026-09-19T15:00:00" không có múi giờ — tài liệu GDACS dùng UTC. */
function toIsoUtc(s: string | null | undefined): string | null {
  if (!s) return null;
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function centroidOf(f: GdacsFeature): { lat: number; lon: number } | null {
  const g = f.geometry;
  if (!g || g.type !== "Point" || !Array.isArray(g.coordinates)) return null;
  const [lon, lat] = g.coordinates as unknown[];
  if (typeof lon !== "number" || typeof lat !== "number") return null;
  return { lat, lon };
}

function inBbox(p: { lat: number; lon: number } | null): boolean {
  if (!p) return false;
  return p.lon >= SEA_DETECT_BBOX.west && p.lon <= SEA_DETECT_BBOX.east && p.lat >= SEA_DETECT_BBOX.south && p.lat <= SEA_DETECT_BBOX.north;
}

function alertOf(s: string | null | undefined): StormEventDetected["alertLevel"] {
  return s === "Green" || s === "Orange" || s === "Red" ? s : null;
}

export interface ParseResult {
  events: StormEventDetected[];
  /** Số feature bị bỏ vì sai schema — ghi log, không crash (UC-13 2a). */
  skipped: number;
}

/**
 * Parse payload GDACS → danh sách sự kiện TC trong bbox Biển Đông.
 * Trường thiếu → null. Không ước lượng.
 */
export function parseGdacsEvents(
  def: SourceDefinition,
  rawJson: unknown,
  meta: { fetchedAt: string; sourceUrl: string },
  opts: { onlyInSea?: boolean } = {},
): ParseResult {
  const parsed = GdacsEventListSchema.safeParse(rawJson);
  if (!parsed.success) {
    throw new Error(`GDACS: payload sai schema — ${parsed.error.issues[0]?.message ?? "unknown"}`);
  }
  const onlyInSea = opts.onlyInSea ?? true;
  const events: StormEventDetected[] = [];
  let skipped = 0;

  for (const f of parsed.data.features) {
    const p = f.properties;
    if (p.eventtype !== "TC") {
      skipped += 1;
      continue;
    }
    const centroid = centroidOf(f);
    if (onlyInSea && !inBbox(centroid)) continue;

    const sev = p.severitydata;
    const maxWindKmh = sev && sev.severityunit === "km/h" && typeof sev.severity === "number" ? sev.severity : null;

    events.push({
      externalId: `gdacs:${p.eventid}`,
      episodeId: p.episodeid != null ? String(p.episodeid) : null,
      nameIntl: p.eventname ?? p.name ?? null,
      alertLevel: alertOf(p.alertlevel),
      isCurrent: p.iscurrent === true || p.iscurrent === "true",
      centroid,
      fromDate: toIsoUtc(p.fromdate),
      toDate: toIsoUtc(p.todate),
      modifiedAt: toIsoUtc(p.datemodified),
      maxWindKmh,
      reportUrl: p.url?.report ?? null,
      attribution: makeAttribution(def, {
        issuedAt: toIsoUtc(p.datemodified),
        fetchedAt: meta.fetchedAt,
        sourceUrl: p.url?.report ?? meta.sourceUrl,
        modified: true, // đã chuyển giờ sang ISO UTC và lọc theo bbox
      }),
    });
  }
  return { events, skipped };
}
