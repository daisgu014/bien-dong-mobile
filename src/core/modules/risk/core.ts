// src/modules/risk/core.ts — public API THUẦN (không React/CSS/Next) dùng chung cho web và app mobile (mobile/).
// index.ts = core + component UI web. Thêm export thuần ở đây trước rồi index.ts re-export.
export type {
  Attribution,
  Confidence,
  HourlyForecastRow,
  LatLon,
  LevelReason,
  PositionSource,
  RiskAssessment,
  RiskFlag,
  RiskLevel,
  SourceId,
  SourceStamp,
  Storm,
  StormSystemType,
  StormTrackPoint,
  TrackKind,
  Vessel,
  VesselPosition,
  VesselWithRisk,
} from "./domain/types";
export { haversineKm, pointInPolygon, EARTH_RADIUS_KM } from "./domain/distance";
export { classify, applyPositionAge, NEAR_GALE_BUFFER_KM, STALE_POSITION_HOURS, TOO_OLD_FOR_DANGER_HOURS } from "./domain/classify";
export { etaGaleHours } from "./domain/eta";
export { sortVessels, bucketCounts, affectedCount, statusSummary, LEVEL_ORDER } from "./domain/sort";
export type { BucketCounts, StatusSummary } from "./domain/sort";
export { isStormStale, POLL_INTERVAL_MINUTES } from "./domain/stale";
export { assessVessel, pickPrimaryStorm, nowPoint } from "./domain/assess";
export { forecastSteps, stormAtStep, assessAtStep } from "./domain/forecast-step";
export type { ForecastStep } from "./domain/forecast-step";
