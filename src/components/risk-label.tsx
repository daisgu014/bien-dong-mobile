import { StyleSheet, Text, View } from "react-native";
import type { RiskLevel } from "@/modules/risk";
import { t } from "@/shared/i18n";
import { useTheme } from "~/theme/use-theme";
import { RiskSymbol } from "./risk-symbol";

const LABEL = { danger: "counterLabels.danger", warn: "counterLabels.warn", watch: "counterLabels.watch", safe: "counterLabels.safe" } as const;

/** Mức nguy hiểm luôn đủ hình + màu + chữ (GAP-06). Chữ thường cho nhẹ mắt (ưu tiên UX của chủ sản phẩm). */
export function RiskLabel({ level }: { level: RiskLevel }) {
  const { c, f } = useTheme();
  const tone = c.risk[level];
  return (
    <View style={styles.row}>
      <RiskSymbol level={level} size={11} />
      <Text style={{ color: level === "danger" ? c.accent : tone.tagFg, fontSize: f.xs, fontWeight: "600" }}>{t(LABEL[level])}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: "row", alignItems: "center", gap: 5 } });
