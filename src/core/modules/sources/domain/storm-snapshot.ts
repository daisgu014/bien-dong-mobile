import type { Attribution } from "./registry-schema";

// Bản chụp bão đã chuẩn hoá do adapter trả về. Cấu trúc trùng với `Storm` §4 (module storm dùng thẳng),
// nhưng khai báo tại đây vì `sources` không phụ thuộc module nào khác.

export type StormSystemType = "TY" | "STS" | "TS" | "TD" | "LOW" | "unknown";

export interface SnapshotTrackPoint {
  at: string;
  kind: "past" | "now" | "forecast";
  lat: number;
  lon: number;
  category: number | null;
  radiusGaleKm: number | null;
  radiusStormKm: number | null;
}

export interface NormalizedStormSnapshot {
  id: string;
  stormKey: string; // nhóm các bản tin của cùng một xoáy thuận
  systemType: StormSystemType;
  codeVn: string; // "BÃO" / "ÁP THẤP NHIỆT ĐỚI" — số hiệu trong nước chỉ có từ DS-01 (BR-11)
  nameVn: string;
  nameIntl: string;
  status: "active" | "weakening" | "dissipated";
  category: number | null; // cấp Beaufort VN quy đổi từ gió trung bình của nguồn (đã chỉnh sửa)
  gust: number | null;
  pressureHpa: number | null;
  moveSpeedKmh: number | null;
  moveDirVn: string | null;
  moveDirEn: string | null;
  radiusGaleKm: number | null;
  radiusStormKm: number | null;
  /** Ngưỡng gốc của bán kính (kt). null = cấp 6/10 Beaufort theo NCHMF. JMA: {gale: 30, storm: 50}. */
  radiusThresholdKt: { gale: number; storm: number } | null;
  /** Chu kỳ lấy trung bình gió của nguồn (phút) — units.md. */
  windAveragingMinutes: number | null;
  landfall: { areaVn: string; areaEn: string; at: string | null } | null;
  track: SnapshotTrackPoint[];
  /** Vị trí quá khứ KHÔNG có giờ (JMA forecast.json) — chỉ để vẽ vệt, không liệt kê. */
  pastPositions: Array<{ lat: number; lon: number }>;
  cone24h: GeoJSON.Polygon | null;
  stamp: {
    sourceId: Attribution["sourceId"];
    sourceName: string;
    issuedAt: string;
    fetchedAt: string;
    isFallback: boolean;
    sourceUrl: string;
    modified: boolean;
  };
}
