// src/modules/sources/core.ts — public API ĐA NỀN TẢNG (không React/Next/server-only) dùng chung cho web và app mobile (mobile/).
// App mobile gọi thẳng nguồn đã đăng ký (Dao chọn 18/11/2026) qua CHÍNH các use-case + adapter zod này:
// policy (evaluateSource), User-Agent có liên hệ, timeout, ETag, giới hạn tần suất của http-client vẫn áp dụng.
export type { Attribution, SourceDefinition, SourceId } from "./domain/registry-schema";
export { SOURCES, getSource, listSources } from "./registry";
export { evaluateSource, isSourceUsable } from "./domain/policy";
export type { SourcePolicyEnv, UsableVerdict } from "./domain/policy";
export { isOfficialVn } from "./domain/attribution";
export type { NormalizedStormSnapshot, StormSystemType } from "./domain/storm-snapshot";
export type { StormEventDetected } from "./infrastructure/adapters/gdacs/adapter";
export { fetchJmaStorms } from "./application/fetch-jma-storms";
export type { FetchJmaResult } from "./application/fetch-jma-storms";
export { fetchOpenMeteoArchive, fetchOpenMeteoDailyForecast, fetchOpenMeteoHours, fetchOpenMeteoMarineDaily, fetchOpenMeteoOutlook } from "./application/fetch-open-meteo-daily";
