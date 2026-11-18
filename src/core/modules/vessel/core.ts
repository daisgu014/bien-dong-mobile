// src/modules/vessel/core.ts — public API THUẦN (không React/localStorage) dùng chung cho web và app mobile (mobile/).
export { normalizeRegNo, matchesRegNo } from "./domain/normalize-reg-no";
export { validateManualPosition, ManualPositionInputSchema, impliedSpeedKn, MAX_IMPLIED_SPEED_KN, MAX_MANUAL_AGE_HOURS, SEA_BOUNDS } from "./domain/validate-position";
export type { ManualPositionInput, PositionValidation } from "./domain/validate-position";
export { NewVesselInputSchema, WATCHLIST_LIMIT, TRAIL_RETENTION_DAYS, buildManualVessel, findDuplicate, mergePositions } from "./domain/watchlist-rules";
export type { NewVesselInput } from "./domain/watchlist-rules";
