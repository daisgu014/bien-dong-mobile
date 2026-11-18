// src/modules/storm/core.ts — public API ĐA NỀN TẢNG dùng chung cho web và app mobile (mobile/):
// hợp nhất nguồn (DS-01 thắng, DS-02 bổ sung) + vùng Biển Đông + BR-02, không kho DB, không server-only.
export type { LiveStormSource, StormRepository } from "./domain/ports";
export { getActiveStorms } from "./application/get-active";
export type { StormWithMeta } from "./application/get-active";
export { seaRelevance, inSeaRegion, SEA_REGION } from "./domain/sea-region";
