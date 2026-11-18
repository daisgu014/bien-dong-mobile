// Hợp đồng dữ liệu phía client — BA-BD-002 §4. Type dùng chung; module khác import qua "@/modules/risk".

export type RiskLevel = "danger" | "warn" | "watch" | "safe"; // BR-03
export type TrackKind = "past" | "now" | "forecast";
export type PositionSource = "vms" | "ais" | "manual";
export type Confidence = "verified" | "unverified";
export type SourceId = "DS-01" | "DS-02" | "DS-03" | "DS-04" | "DS-05" | "DS-06" | "DS-07";

export interface SourceStamp {
  sourceId: SourceId;
  sourceName: string; // "NCHMF", "RSMC Tokyo — JMA"…
  issuedAt: string; // ISO UTC — thời điểm phát hành bản tin
  fetchedAt: string; // ISO UTC
  isFallback: boolean; // true khi đang dùng nguồn dự phòng
  sourceUrl: string; // link bản tin gốc (BR-01)
  modified: boolean; // app đã chuyển đổi đơn vị/ngôn ngữ
}

/** Attribution tối thiểu cho DTO (CLAUDE.md quy tắc 1). `SourceStamp` là mở rộng của nó. */
export interface Attribution {
  sourceId: SourceId;
  issuedAt: string | null;
  fetchedAt: string;
  sourceUrl: string;
  modified: boolean;
}

export interface StormTrackPoint {
  at: string; // ISO UTC
  kind: TrackKind;
  lat: number;
  lon: number;
  category: number | null;
  radiusGaleKm: number | null;
  radiusStormKm: number | null;
}

export type StormSystemType = "TY" | "STS" | "TS" | "TD" | "LOW" | "unknown";

export interface Storm {
  id: string;
  /** Nhóm các bản tin của cùng một xoáy thuận (id đổi theo mỗi bản tin, A-02). */
  stormKey?: string;
  /** Loại hệ thống theo nguồn: bão (TY/STS/TS), áp thấp nhiệt đới (TD), vùng áp thấp (LOW). */
  systemType?: StormSystemType;
  codeVn: string; // "BÃO SỐ 9" (DS-01) hoặc "BÃO" / "ÁP THẤP NHIỆT ĐỚI" khi nguồn không có số hiệu trong nước
  nameVn: string; // "TRÀ MI"
  nameIntl: string; // "TRAMI"
  status: "active" | "weakening" | "dissipated";
  category: number | null; // cấp gió Beaufort VN
  gust: number | null;
  pressureHpa: number | null;
  moveSpeedKmh: number | null;
  moveDirVn: string | null;
  moveDirEn: string | null;
  radiusGaleKm: number | null; // bán kính gió cấp 6 tại "now" — từ nguồn, KHÔNG ước lượng
  radiusStormKm: number | null; // bán kính gió cấp 10 tại "now" — từ nguồn
  /** Ngưỡng gốc của hai bán kính (kt). Không có/null = cấp 6/10 Beaufort (NCHMF). JMA: {gale: 30, storm: 50}. */
  radiusThresholdKt?: { gale: number; storm: number } | null;
  /** Chu kỳ lấy trung bình gió của nguồn (phút) — hiển thị kèm khi không phải NCHMF (units.md). */
  windAveragingMinutes?: number | null;
  landfall: { areaVn: string; areaEn: string; at: string | null } | null;
  track: StormTrackPoint[];
  /** Vị trí quá khứ không có giờ (chỉ để vẽ vệt; không liệt kê). */
  pastPositions?: LatLon[];
  cone24h: GeoJSON.Polygon | null; // CHỈ khi nguồn cung cấp
  stamp: SourceStamp;
}

export interface VesselPosition {
  at: string;
  lat: number;
  lon: number;
  speedKn: number | null;
  courseDeg: number | null;
  source: PositionSource;
  confidence: Confidence;
}

export interface Vessel {
  id: string;
  regNo: string; // "QNg 95172 TS"
  regNoNormalized: string; // BR-13
  mmsi: string | null;
  label: string | null; // nhãn riêng tư của người dùng (Watch.label, GAP-17)
  type: string;
  lengthM: number | null;
  crewCount: number | null;
  ownerName: string | null; // BR-16: chỉ tên
  fishingGround: string | null;
  positionMethod: PositionSource;
  status: "active" | "paused" | "lost_signal";
  lastPosition: VesselPosition | null;
  trail: VesselPosition[]; // ≤ 90 ngày, tăng dần theo thời gian
  thresholdKm?: number | null; // BR-21: ngưỡng người dùng, chỉ mở rộng mức THEO DÕI
}

export type LevelReason = "in_storm_radius" | "in_gale_radius" | "near_gale" | "in_cone_24h" | "outside" | "no_storm";
export type RiskFlag = "unverified" | "stale" | "too_old_for_danger" | "lost_signal";

export interface RiskAssessment {
  vesselId: string;
  stormId: string | null;
  computedAt: string;
  distanceKm: number | null;
  level: RiskLevel;
  levelReason: LevelReason;
  etaGaleHours: number | "inside" | null; // BR-04
  positionAgeMinutes: number;
  flags: RiskFlag[]; // BR-07
  basedOnPositionAt: string;
}

export interface HourlyForecastRow {
  at: string;
  windLevel: number | null;
  gustLevel: number | null;
  rainMm: number | null;
  seaHeightM: [number, number] | null;
  windDir: string | null;
}

export type VesselWithRisk = Vessel & { risk: RiskAssessment };

export interface LatLon {
  lat: number;
  lon: number;
}
