import { ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Storm, VesselWithRisk } from "@/modules/risk";
import { t } from "@/shared/i18n";
import { distanceText, etaShort } from "~/lib/format";
import { useTheme } from "~/theme/use-theme";
import { RiskLabel } from "./risk-label";

const FLAG_KEYS = { unverified: "risk.flag.unverified", stale: "risk.flag.stale", too_old_for_danger: "risk.flag.too_old_for_danger", lost_signal: "risk.flag.lost_signal" } as const;

/**
 * M-05 thẻ ghe dạng danh sách kẻ mảnh: số hiệu, mức (hình + màu + chữ), một dòng chữ thường "73 km tới tâm · … · Nhập tay".
 * Đọc theo thứ tự "số hiệu, mức, khoảng cách" (AT-10). Cờ CHƯA XÁC THỰC / VỊ TRÍ CŨ / MẤT TÍN HIỆU luôn hiện (AT-09, GAP-16).
 */
export function VesselRow({ v, onPress, storm }: { v: VesselWithRisk; onPress: () => void; storm: Storm | null }) {
  const hasStorm = storm !== null;
  const { c, f } = useTheme();
  const r = v.risk;
  const flags = [...new Set(r.flags.map((x) => t(FLAG_KEYS[x])))];
  const line = [
    hasStorm ? t("vessel.card.toEye", { km: distanceText(r) }) : null,
    hasStorm ? etaShort(r, storm) : null,
    t(`vessel.source.${v.lastPosition?.source ?? v.positionMethod}`),
  ].filter(Boolean);
  const paused = v.status === "paused";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("vessel.a11yRow", { regNo: v.regNo, level: t(`risk.${r.level}`), distance: distanceText(r) })}
      style={({ pressed }) => [styles.row, { borderBottomColor: c.divider, opacity: paused ? 0.6 : 1, backgroundColor: pressed ? c.surface2 : "transparent" }]}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <View style={styles.top}>
          <Text style={{ color: c.text, fontSize: f.md, fontWeight: "700" }} numberOfLines={1}>
            {v.regNo}
          </Text>
          {v.label ? (
            <Text style={{ color: c.muted, fontSize: f.sm }} numberOfLines={1}>
              {v.label}
            </Text>
          ) : null}
        </View>
        <View style={styles.top}>
          {paused ? <Text style={{ color: c.muted, fontSize: f.xs, fontWeight: "600" }}>{t("vesselList.paused")}</Text> : <RiskLabel level={r.level} />}
          {flags.map((x) => (
            <Text key={x} style={{ color: c.risk.warn.tagFg, fontSize: f.xs, fontWeight: "600" }}>
              {x}
            </Text>
          ))}
        </View>
        <Text style={{ color: c.muted, fontSize: f.sm }} numberOfLines={1}>
          {line.join(" · ")}
        </Text>
      </View>
      <ChevronRight color={c.muted} size={18} />
    </Pressable>
  );
}


const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, minHeight: 56, borderBottomWidth: StyleSheet.hairlineWidth },
  top: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
});
