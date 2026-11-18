// Fixture chuẩn BA-BD-002 §11.1 — KHÔNG sửa giá trị kỳ vọng để test xanh (.claude/rules/testing.md).
// Giờ trong tài liệu là GMT+7; ở đây lưu UTC (A-05). 16:53 GMT+7 = 09:53Z.
import type { Storm, StormTrackPoint, Vessel, VesselPosition } from "../domain/types";

export const FIXTURE_NOW = "2026-09-17T09:53:00Z";

const NOW_AT = "2026-09-17T09:00:00Z"; // 16:00 GMT+7 — giờ phát hành bản tin

/** Đường đi: điểm "now" đúng theo §11.1; các điểm quá khứ/dự báo là dữ liệu seed minh hoạ (bão đi Tây Tây Bắc ~18 km/h). */
function track(): StormTrackPoint[] {
  const pts: StormTrackPoint[] = [];
  const push = (hours: number, kind: StormTrackPoint["kind"], lat: number, lon: number, category: number | null) => {
    const at = new Date(new Date(NOW_AT).getTime() + hours * 3_600_000).toISOString();
    pts.push({
      at,
      kind,
      lat,
      lon,
      category,
      radiusGaleKm: kind === "now" ? 265 : kind === "forecast" ? 265 : null,
      radiusStormKm: kind === "now" ? 125 : null,
    });
  };
  push(-24, "past", 13.6, 117.3, 10);
  push(-18, "past", 14.0, 116.3, 11);
  push(-12, "past", 14.5, 115.3, 11);
  push(-6, "past", 14.9, 114.2, 12);
  push(0, "now", 15.2, 113.2, 12);
  push(12, "forecast", 15.9, 111.4, 12);
  push(24, "forecast", 16.5, 109.6, 11);
  push(36, "forecast", 17.0, 108.0, 9);
  push(48, "forecast", 17.6, 106.4, 7);
  return pts;
}

export const fixtureStorm: Storm = {
  id: "storm-2026-09-tra-mi-b09",
  stormKey: "nchmf:b09-2026",
  systemType: "TY",
  codeVn: "BÃO SỐ 9",
  nameVn: "TRÀ MI",
  nameIntl: "TRAMI",
  status: "active",
  category: 12,
  gust: 15,
  pressureHpa: 955,
  moveSpeedKmh: 18,
  moveDirVn: "Tây Tây Bắc",
  moveDirEn: "WNW",
  radiusGaleKm: 265,
  radiusStormKm: 125,
  landfall: { areaVn: "Quảng Trị – Thừa Thiên Huế", areaEn: "Quang Tri – Thua Thien Hue", at: "2026-09-18T20:00:00Z" },
  track: track(),
  cone24h: null,
  stamp: {
    sourceId: "DS-01",
    sourceName: "Trung tâm Dự báo KTTV Quốc gia",
    issuedAt: NOW_AT,
    fetchedAt: "2026-09-17T09:05:00Z",
    isFallback: false,
    sourceUrl: "https://nchmf.gov.vn/",
    modified: false,
  },
};

function pos(
  at: string,
  lat: number,
  lon: number,
  source: VesselPosition["source"],
  speedKn: number | null,
  courseDeg: number | null,
): VesselPosition {
  return { at, lat, lon, speedKn, courseDeg, source, confidence: source === "manual" ? "unverified" : "verified" };
}

function vessel(
  id: string,
  regNo: string,
  regNoNormalized: string,
  method: Vessel["positionMethod"],
  trail: VesselPosition[],
  extra: Partial<Vessel> = {},
): Vessel {
  const last = trail[trail.length - 1] ?? null;
  return {
    id,
    regNo,
    regNoNormalized,
    mmsi: method === "ais" ? `5740${id.slice(-5)}` : null,
    label: null,
    type: "Tàu cá vỏ gỗ",
    lengthM: 18.5,
    crewCount: 8,
    ownerName: null,
    fishingGround: "Ngư trường Hoàng Sa",
    positionMethod: method,
    status: "active",
    lastPosition: last,
    trail,
    ...extra,
  };
}

// Cập nhật (GMT+7) → UTC: 16:42→09:42Z, 16:51→09:51Z, 16:30→09:30Z, 14:10→07:10Z, 16:49→09:49Z.
export const fixtureVessels: Vessel[] = [
  vessel(
    "v-qng-95172",
    "QNg 95172 TS",
    "QNG95172TS",
    "vms",
    [
      pos("2026-09-17T03:42:00Z", 14.55, 112.95, "vms", 6.2, 300),
      pos("2026-09-17T06:42:00Z", 14.72, 112.78, "vms", 6.0, 305),
      pos("2026-09-17T09:42:00Z", 14.9, 112.6, "vms", 5.8, 310),
    ],
    { lengthM: 18.5, crewCount: 9, ownerName: "Nguyễn Văn Bốn", fishingGround: "Ngư trường Hoàng Sa" },
  ),
  vessel(
    "v-qng-90567",
    "QNg 90567 TS",
    "QNG90567TS",
    "ais",
    [
      pos("2026-09-17T05:51:00Z", 16.05, 111.2, "ais", 7.5, 300),
      pos("2026-09-17T07:51:00Z", 16.18, 110.95, "ais", 7.1, 300),
      pos("2026-09-17T09:51:00Z", 16.3, 110.7, "ais", 7.0, 298),
    ],
    { lengthM: 21.0, crewCount: 11, ownerName: "Trần Thị Hạnh", fishingGround: "Ngư trường Hoàng Sa" },
  ),
  vessel(
    "v-bd-96231",
    "BĐ 96231 TS",
    "BD96231TS",
    "vms",
    [
      pos("2026-09-17T03:30:00Z", 12.6, 110.8, "vms", 8.0, 290),
      pos("2026-09-17T06:30:00Z", 12.75, 110.5, "vms", 8.2, 292),
      pos("2026-09-17T09:30:00Z", 12.9, 110.2, "vms", 8.4, 295),
    ],
    { lengthM: 16.8, crewCount: 7, ownerName: "Lê Minh Tuấn", fishingGround: "Ngư trường Trường Sa" },
  ),
  vessel(
    "v-kh-91188",
    "KH 91188 TS",
    "KH91188TS",
    "manual",
    [pos("2026-09-17T07:10:00Z", 11.4, 111.6, "manual", null, null)],
    { lengthM: 15.2, crewCount: 6, ownerName: "Phạm Ngọc Dũng", fishingGround: "Ngư trường Trường Sa", mmsi: null },
  ),
  vessel(
    "v-dna-90102",
    "ĐNa 90102",
    "DNA90102",
    "ais",
    [
      pos("2026-09-17T05:49:00Z", 17.15, 108.95, "ais", 6.5, 320),
      pos("2026-09-17T07:49:00Z", 17.28, 108.78, "ais", 6.4, 320),
      pos("2026-09-17T09:49:00Z", 17.4, 108.6, "ais", 6.2, 318),
    ],
    { lengthM: 19.4, crewCount: 10, ownerName: "Võ Thị Lài", fishingGround: "Vịnh Bắc Bộ" },
  ),
];

/** Kỳ vọng §11.1 (sai số khoảng cách ±1 km). */
export const fixtureExpectations = [
  { regNo: "QNg 95172 TS", distanceKm: 73, level: "danger", eta: "inside", flags: [] },
  { regNo: "QNg 90567 TS", distanceKm: 294, level: "watch", eta: 2, flags: [] },
  { regNo: "BĐ 96231 TS", distanceKm: 412, level: "watch", eta: 8, flags: [] },
  { regNo: "KH 91188 TS", distanceKm: 457, level: "watch", eta: 11, flags: ["unverified"] },
  { regNo: "ĐNa 90102", distanceKm: 548, level: "safe", eta: null, flags: [] },
] as const;

export const fixtureExpectedCounts = { danger: 1, warn: 0, watch: 3, safe: 1 } as const;
export const fixtureExpectedStatus = "1 ghe trong vùng ảnh hưởng của bão";
