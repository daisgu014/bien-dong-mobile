import { z } from "zod";
import type { Vessel, VesselPosition } from "@/modules/risk";
import { normalizeRegNo } from "./normalize-reg-no";

/** BR-15: hạn mức ghe cho tài khoản người dân (chưa có loại tài khoản chủ đội tàu — TODO(BA-BD-002 §12): 200 ghe). */
export const WATCHLIST_LIMIT = 20;
/** BR-17: lịch sử hành trình giữ 90 ngày. */
export const TRAIL_RETENTION_DAYS = 90;

/** Thông tin ghe khi thêm mới (UC-05 bước 1/4, UC-07 bước 1). Vị trí đi riêng qua `validateManualPosition`. */
export const NewVesselInputSchema = z.object({
  regNo: z.string().trim().min(3, "Số hiệu quá ngắn").max(40),
  mmsi: z
    .string()
    .trim()
    .regex(/^\d{9}$/, "MMSI gồm 9 chữ số")
    .nullable()
    .optional(),
  label: z.string().trim().max(40).nullable().optional(),
  type: z.string().trim().max(40).nullable().optional(),
  lengthM: z.number().positive().max(200).nullable().optional(),
  crewCount: z.number().int().min(0).max(200).nullable().optional(),
});
export type NewVesselInput = z.infer<typeof NewVesselInputSchema>;

/** BR-14: một ghe chỉ xuất hiện một lần — theo MMSI nếu có, nếu không theo số hiệu đã chuẩn hoá (BR-13). */
export function findDuplicate(existing: readonly Pick<Vessel, "id" | "mmsi" | "regNoNormalized">[], regNo: string, mmsi: string | null | undefined) {
  const norm = normalizeRegNo(regNo);
  if (mmsi) {
    const byMmsi = existing.find((v) => v.mmsi === mmsi);
    if (byMmsi) return byMmsi;
  }
  return norm ? (existing.find((v) => v.regNoNormalized === norm) ?? null) : null;
}

/**
 * BR-06: với cùng một ghe, bản ghi mới hơn thắng; cùng thời điểm thì bản đã xác thực thắng.
 * Gộp vị trí nhập tay (lưu cục bộ) vào ghe từ máy chủ; cắt lịch sử theo BR-17.
 */
export function mergePositions(vessel: Vessel, extra: readonly VesselPosition[], now: string): Vessel {
  if (extra.length === 0) return vessel;
  const minMs = new Date(now).getTime() - TRAIL_RETENTION_DAYS * 86_400_000;
  const byAt = new Map<string, VesselPosition>();
  for (const p of [...vessel.trail, ...(vessel.lastPosition ? [vessel.lastPosition] : []), ...extra]) {
    if (new Date(p.at).getTime() < minMs) continue;
    const cur = byAt.get(p.at);
    if (!cur || (cur.confidence === "unverified" && p.confidence === "verified")) byAt.set(p.at, p);
  }
  const trail = [...byAt.values()].sort((a, b) => a.at.localeCompare(b.at));
  return { ...vessel, trail, lastPosition: trail[trail.length - 1] ?? null };
}

/** Tạo ghe theo dõi nhập tay (UC-07): vị trí luôn `manual` + `unverified` (BR-07, GAP-16). */
export function buildManualVessel(id: string, input: NewVesselInput, position: Omit<VesselPosition, "source" | "confidence">): Vessel {
  const pos: VesselPosition = { ...position, source: "manual", confidence: "unverified" };
  return {
    id,
    regNo: input.regNo.trim().replace(/\s+/g, " "),
    regNoNormalized: normalizeRegNo(input.regNo),
    mmsi: input.mmsi || null,
    label: input.label || null,
    type: input.type || "Tàu cá",
    lengthM: input.lengthM ?? null,
    crewCount: input.crewCount ?? null,
    ownerName: null,
    fishingGround: null,
    positionMethod: "manual",
    status: "active",
    lastPosition: pos,
    trail: [pos],
  };
}
