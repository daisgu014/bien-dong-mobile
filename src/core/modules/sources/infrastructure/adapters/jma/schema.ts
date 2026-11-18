import { z } from "zod";

// JMA bosai typhoon JSON — xác minh 21/09/2026 (fixture jma-*-20260921.json). Schema KHOAN DUNG: passthrough, thiếu → null.
// - targetTc.json: danh sách xoáy thuận đang được JMA phát bản tin (bão + áp thấp nhiệt đới có dự báo).
// - {tcId}/specifications.json: thông số theo từng mốc (thực tế, ước tính 1h, dự báo).
// - {tcId}/forecast.json: đường đi quá khứ (không có giờ) + tâm/vòng gió theo mốc.

const numStr = z.union([z.number(), z.string()]).nullish();

export const JmaTargetTcSchema = z.array(
  z
    .object({
      tropicalCyclone: z.string(),
      typhoonNumber: z.string().nullish(),
      category: z.string().nullish(), // "TY" | "STS" | "TS" | "TD" | "LOW"…
      issue: z.string().nullish(),
    })
    .passthrough(),
);

const RangeSchema = z.object({ area: z.unknown().optional(), range: z.object({ km: numStr, nm: numStr }).partial().nullish() }).passthrough();

const PartSchema = z
  .object({
    part: z.union([z.string(), z.object({ jp: z.string().nullish(), en: z.string().nullish() }).passthrough()]),
    issue: z.object({ JST: z.string().nullish(), UTC: z.string().nullish() }).passthrough().nullish(),
    typhoonNumber: z.string().nullish(),
    name: z.object({ jp: z.string().nullish(), en: z.string().nullish() }).passthrough().nullish(),
    category: z.object({ jp: z.string().nullish(), en: z.string().nullish() }).passthrough().nullish(),
    advancedHours: z.number().nullish(),
    validtime: z.object({ JST: z.string().nullish(), UTC: z.string().nullish() }).passthrough().nullish(),
    position: z.object({ deg: z.array(z.number()).nullish() }).passthrough().nullish(),
    maximumWind: z
      .object({
        sustained: z.object({ "m/s": numStr, kt: numStr }).passthrough().nullish(),
        gust: z.object({ "m/s": numStr, kt: numStr }).passthrough().nullish(),
      })
      .passthrough()
      .nullish(),
    galeWarning: z.array(RangeSchema).nullish(),
    stormWarning: z.array(RangeSchema).nullish(),
    course: z.string().nullish(),
    speed: z.object({ "km/h": numStr, kt: numStr }).passthrough().nullish(),
    pressure: numStr,
    probabilityCircleRadius: z.object({ km: numStr }).passthrough().nullish(),
  })
  .passthrough();

export const JmaSpecificationsSchema = z.array(PartSchema);

export const JmaForecastSchema = z.array(
  z
    .object({
      part: z.unknown(),
      advancedHours: z.number().nullish(),
      track: z
        .object({
          preTyphoon: z.array(z.array(z.number())).nullish(),
          typhoon: z.array(z.array(z.number())).nullish(),
        })
        .passthrough()
        .nullish(),
      center: z.array(z.number()).nullish(),
    })
    .passthrough(),
);

export type JmaTargetTc = z.infer<typeof JmaTargetTcSchema>;
export type JmaSpecifications = z.infer<typeof JmaSpecificationsSchema>;
export type JmaSpecPart = z.infer<typeof PartSchema>;
export type JmaForecast = z.infer<typeof JmaForecastSchema>;
