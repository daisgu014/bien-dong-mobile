import type { RiskLevel } from "@/modules/risk";

/** §8.3 #9 — ký hiệu ghe 10 px, viền 1.8 px, khác hình theo mức (GAP-06). */
export const SYMBOL_R = 5;
export const SYMBOL_STROKE = 1.8;

export function symbolPath(level: RiskLevel, r: number): string {
  switch (level) {
    case "danger": // ◆
      return `M0 ${-r} L${r} 0 L0 ${r} L${-r} 0 Z`;
    case "warn": // ▲
      return `M0 ${-r} L${r} ${r * 0.9} L${-r} ${r * 0.9} Z`;
    case "watch": // ■
      return `M${-r * 0.85} ${-r * 0.85} H${r * 0.85} V${r * 0.85} H${-r * 0.85} Z`;
    case "safe": // ○
      return `M${-r} 0 a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
  }
}
