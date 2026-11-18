// Định dạng hiển thị dùng chung trên app (chuỗi lấy từ src/shared/i18n của web).
import type { RiskAssessment, Storm } from "@/modules/risk";
import { formatKm } from "@/shared/format/units";
import { t } from "@/shared/i18n";

/** §5.3 / GAP-03. */
export function etaText(r: RiskAssessment): string {
  if (r.etaGaleHours === "inside") return t("risk.etaInside");
  if (r.etaGaleHours === null) return t("risk.etaOutside");
  return t("risk.etaHours", { n: r.etaGaleHours });
}

export function distanceText(r: RiskAssessment): string {
  return r.distanceKm === null ? t("app.dash") : formatKm(Math.round(r.distanceKm));
}

/** Nhãn hai bán kính: NCHMF = cấp 6/10; JMA = ngưỡng 30/50 kt của nguồn (docs/data-sources.md §3.4 — không gọi là "cấp 6"). */
export function radiusLabels(storm: Storm): { gale: string; storm: string } {
  const kt = storm.radiusThresholdKt;
  if (kt) return { gale: t("systems.radiusKt", { kt: kt.gale }), storm: t("systems.radiusKt", { kt: kt.storm }) };
  return { gale: t("storm.grid.gale"), storm: t("storm.grid.storm") };
}

export function stormLine(storm: Storm): string {
  const parts: string[] = [];
  if (storm.category !== null) parts.push(storm.gust !== null ? t("storm.category", { c: storm.category, g: storm.gust }) : t("storm.categoryOnly", { c: storm.category }));
  if (storm.moveSpeedKmh !== null) parts.push(t("storm.move", { speed: storm.moveSpeedKmh, dir: storm.moveDirVn ?? "" }).trim());
  return parts.join(" · ") || t("app.notProvided");
}

/** Diễn giải mức (UC-08) — với JMA, hai nhánh bán kính nêu ngưỡng kt của nguồn (Q-B1). */
export function reasonText(r: RiskAssessment, storm: Storm | null): string {
  const kt = storm?.radiusThresholdKt;
  if (kt && r.levelReason === "in_storm_radius") return t("risk.reasonKt.in_storm_radius", { kt: kt.storm });
  if (kt && r.levelReason === "in_gale_radius") return t("risk.reasonKt.in_gale_radius", { kt: kt.gale });
  return t(`risk.reason.${r.levelReason}`);
}

/** Nhãn dòng "Gió cấp 6 tới sau" — JMA: "Gió ≥ 30 kt tới sau". */
export function etaLabel(storm: Storm | null): string {
  const kt = storm?.radiusThresholdKt;
  return kt ? t("vessel.detail.etaKt", { kt: kt.gale }) : t("vessel.detail.eta");
}

/** Cụm ngắn trong dòng thẻ ghe. */
export function etaShort(r: RiskAssessment, storm: Storm | null): string | null {
  const kt = storm?.radiusThresholdKt;
  if (r.etaGaleHours === "inside") return kt ? t("vessel.card.insideKt", { kt: kt.gale }) : t("vessel.card.inside");
  if (typeof r.etaGaleHours === "number") return kt ? t("vessel.card.etaInKt", { kt: kt.gale, n: r.etaGaleHours }) : t("vessel.card.etaIn", { n: r.etaGaleHours });
  return null;
}
