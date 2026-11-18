import { z } from "zod";

// Payload GDACS `events/geteventlist/SEARCH?eventlist=TC` — xác minh 21/09/2026 (fixture gdacs-20260921.json).
// Schema KHOAN DUNG: chỉ khai báo trường app dùng; trường lạ bỏ qua, trường thiếu → null (không suy diễn).

const looseString = z.string().nullish();
const looseNumber = z.coerce.number().nullish();

export const GdacsFeatureSchema = z.object({
  type: z.literal("Feature"),
  geometry: z
    .object({
      type: z.string(),
      coordinates: z.unknown(),
    })
    .nullish(),
  properties: z.object({
    eventtype: z.string(),
    eventid: z.coerce.number(),
    episodeid: z.coerce.number().nullish(),
    eventname: looseString,
    name: looseString,
    alertlevel: looseString,
    iscurrent: z.union([z.string(), z.boolean()]).nullish(),
    fromdate: looseString,
    todate: looseString,
    datemodified: looseString,
    country: looseString,
    url: z
      .object({
        report: looseString,
        details: looseString,
        geometry: looseString,
      })
      .nullish(),
    severitydata: z
      .object({
        severity: looseNumber,
        severitytext: looseString,
        severityunit: looseString,
      })
      .nullish(),
  }),
});

export const GdacsEventListSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(GdacsFeatureSchema),
});

export type GdacsEventList = z.infer<typeof GdacsEventListSchema>;
export type GdacsFeature = z.infer<typeof GdacsFeatureSchema>;
