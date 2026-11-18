import Svg, { Path } from "react-native-svg";
import type { RiskLevel } from "@/modules/risk";
import { symbolPath } from "@/modules/map";
import { useTheme } from "~/theme/use-theme";

/** Ký hiệu mức §9.4: hình + màu (GAP-06). */
export function RiskSymbol({ level, size = 12, dashed = false }: { level: RiskLevel; size?: number; dashed?: boolean }) {
  const { c } = useTheme();
  const r = size / 2 - 1.2;
  const color = level === "safe" ? c.risk.safe.tagFg : c.risk[level].symbol;
  return (
    <Svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} accessible={false}>
      <Path d={symbolPath(level, r)} fill={level === "safe" ? "none" : color} stroke={color} strokeWidth={1.6} strokeDasharray={dashed ? "2 1.5" : undefined} />
    </Svg>
  );
}
