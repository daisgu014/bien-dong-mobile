import type { Attribution, SourceDefinition } from "./registry-schema";

/** Tạo attribution cho một bản ghi vừa chuẩn hoá. `modified: true` khi app đã chuyển đổi đơn vị/ngôn ngữ. */
export function makeAttribution(
  def: SourceDefinition,
  input: { issuedAt: string | null; fetchedAt: string; sourceUrl: string; modified?: boolean },
): Attribution {
  return {
    sourceId: def.id,
    issuedAt: input.issuedAt,
    fetchedAt: input.fetchedAt,
    sourceUrl: input.sourceUrl,
    modified: input.modified ?? def.requiresModificationNotice,
  };
}

/** Nhãn "Chính thức" chỉ cho official_vn; mọi nguồn khác là "Tham khảo quốc tế" (CLAUDE.md quy tắc 4). */
export function isOfficialVn(def: SourceDefinition): boolean {
  return def.officialStatus === "official_vn";
}
