import type { SourceDefinition } from "./registry-schema";

/** Phần env mà policy cần — truyền vào để domain không đọc process.env. */
export interface SourcePolicyEnv {
  commercialMode: boolean;
  hasPaidKey: (sourceId: SourceDefinition["id"]) => boolean;
  disabledIds: ReadonlySet<string>;
}

export type UsableVerdict = { usable: true } | { usable: false; reason: string };

/** docs/data-sources.md §3.2 — chỉ bật nguồn `approved*`, khớp chế độ thương mại, không bị tắt ở runtime. */
export function evaluateSource(def: SourceDefinition, env: SourcePolicyEnv): UsableVerdict {
  if (!def.status.startsWith("approved")) return { usable: false, reason: `status=${def.status}` };
  if (!def.enabled) return { usable: false, reason: "enabled=false" };
  if (env.disabledIds.has(def.id)) return { usable: false, reason: "SOURCE_DISABLE" };
  if (env.commercialMode) {
    if (def.commercialUse === "unknown") return { usable: false, reason: "commercialUse=unknown" };
    if (def.commercialUse === "requires_plan" && !env.hasPaidKey(def.id)) {
      return { usable: false, reason: "commercialUse=requires_plan, thiếu khoá trả phí" };
    }
  }
  return { usable: true };
}

export function isSourceUsable(def: SourceDefinition, env: SourcePolicyEnv): boolean {
  return evaluateSource(def, env).usable;
}

/** Điều khoản đã kiểm tra quá 180 ngày → cần rà lại. */
export function termsNeedRecheck(def: SourceDefinition, now: Date, maxAgeDays = 180): boolean {
  const checked = new Date(`${def.termsCheckedAt}T00:00:00Z`).getTime();
  return now.getTime() - checked > maxAgeDays * 86_400_000;
}
