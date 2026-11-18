import { z } from "zod";

// Schema registry nguồn — docs/data-sources.md §3.1. Thiếu trường nào thì zod báo lỗi khi build/test.
export const SourceIdSchema = z.enum(["DS-01", "DS-02", "DS-03", "DS-04", "DS-05", "DS-06", "DS-07"]);
export type SourceId = z.infer<typeof SourceIdSchema>;

export const SourceStatusSchema = z.enum([
  "approved",
  "approved_noncommercial",
  "pending_agreement",
  "pending_review",
  "disabled",
]);

export const SourceDefinitionSchema = z
  .object({
    id: SourceIdSchema,
    name: z.string().min(1),
    shortName: z.string().min(1), // "NCHMF", "JMA"… dùng ở thanh nguồn
    owner: z.string().min(1),
    role: z.string().min(1), // vai trò trong app (hiển thị ở /nguon-du-lieu)
    homepage: z.url(),
    termsUrl: z.url(),
    licenseName: z.string().min(1),
    licenseUrl: z.url().nullable(),
    attributionText: z.object({
      vi: z.string().min(1),
      en: z.string().min(1),
      original: z.string().min(1).optional(), // ví dụ "出典：気象庁"
    }),
    requiresModificationNotice: z.boolean(),
    commercialUse: z.enum(["allowed", "requires_plan", "unknown"]),
    officialStatus: z.enum(["official_vn", "international_reference", "derived"]),
    status: SourceStatusSchema,
    enabled: z.boolean(),
    termsCheckedAt: z.iso.date(), // YYYY-MM-DD
    pollIntervalMinutes: z.number().int().positive().nullable(),
    maxRequestsPerDay: z.number().int().positive().nullable(),
    userAgent: z.string().min(1),
    /** Chu kỳ lấy trung bình gió của nguồn (phút) — units.md: không quy đổi giữa 1 phút và 10 phút. */
    windAveragingMinutes: z.number().int().positive().nullable(),
    notes: z.string().optional(),
  })
  .refine((s) => !s.enabled || s.status.startsWith("approved"), {
    message: "Chỉ được bật nguồn có status bắt đầu bằng 'approved' (docs/data-sources.md §3.2)",
    path: ["enabled"],
  });

export type SourceDefinition = z.infer<typeof SourceDefinitionSchema>;

/** Attribution bắt buộc trên mọi DTO mang dữ liệu ngoài (CLAUDE.md quy tắc 1). */
export const AttributionSchema = z.object({
  sourceId: SourceIdSchema,
  issuedAt: z.iso.datetime({ offset: true }).nullable(),
  fetchedAt: z.iso.datetime({ offset: true }),
  sourceUrl: z.url(),
  modified: z.boolean(),
});
export type Attribution = z.infer<typeof AttributionSchema>;
