// S-02 — màn hình chính mobile (tab Bản đồ). Thứ tự dọc §7.2: Header → Băng cảnh báo → Thanh phân mức → Bản đồ → Danh sách ghe.
import { router } from "expo-router";
import { ChevronDown, ChevronRight, ChevronUp, Moon, Sun, TriangleAlert } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { RiskLevel } from "@/modules/risk";
import { formatTimeDateGmt7, formatTimeGmt7 } from "@/shared/format/gmt7";
import { t } from "@/shared/i18n";
import { RiskSymbol } from "~/components/risk-symbol";
import { StormMap } from "~/components/storm-map";
import { Button } from "~/components/ui";
import { VesselRow } from "~/components/vessel-row";
import { stormLine } from "~/lib/format";
import { useSettings } from "~/lib/settings-store";
import { useWatchlist } from "~/lib/use-watchlist";
import { GUTTER } from "~/theme/tokens";
import { useTheme } from "~/theme/use-theme";
import { SafeAreaView } from "react-native-safe-area-context";

const LEVELS: RiskLevel[] = ["danger", "warn", "watch", "safe"];

export default function MapScreen() {
  const { c, f, name } = useTheme();
  const setTheme = useSettings((s) => s.setTheme);
  const view = useSettings((s) => s.mapView);
  const { storms, watchlist, primaryMeta } = useWatchlist();
  const [selected, setSelected] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<RiskLevel | null>(null);
  const storm = watchlist.primary;
  const s = watchlist.summary;
  const hasDanger = watchlist.counts.danger > 0;

  const offline = storms.isError;
  const loading = storms.isPending;
  const bandText = loading
    ? t("app.loading")
    : offline && !storms.data
      ? t("app.error")
      : s.kind === "affected"
        ? t("status.affected", { n: s.n })
        : s.kind === "none"
          ? t("status.none")
          : t("status.noStorm");
  const bandBg = hasDanger ? c.accent700 : c.surface;
  const bandFg = hasDanger ? "#ffffff" : c.text;

  const list = watchlist.vessels.filter((v) => (filter ? v.risk.level === filter && v.status !== "paused" : true));

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.bg }}>
      {/* M-01 Header */}
      <View style={styles.header}>
        <Pressable style={{ flex: 1 }} disabled={!storm} onPress={() => router.push("/bao")} accessibilityRole="button">
          <View style={styles.rowCenter}>
            <Text style={{ color: c.text, fontSize: f.xl, fontWeight: "700", flexShrink: 1 }} numberOfLines={1}>
              {storm ? `${storm.codeVn} — ${storm.nameVn}` : t("app.name")}
            </Text>
            {storm && <ChevronRight color={c.muted} size={18} />}
          </View>
          {storm && <Text style={{ color: c.muted, fontSize: f.sm }}>{stormLine(storm)}</Text>}
          {storm && (
            <Text style={{ color: primaryMeta?.stale ? c.accent : c.muted, fontSize: f.xs }} numberOfLines={2}>
              {storm.stamp.sourceName} · {t("source.bulletin")} {formatTimeGmt7(storm.stamp.issuedAt)} · {t("app.gmt7")}
              {primaryMeta?.stale ? ` · ${t("source.stale")}` : ""}
              {storm.stamp.isFallback ? ` · ${t("source.fallback")}` : ""}
            </Text>
          )}
        </Pressable>
        <View style={styles.rowCenter}>
          {offline ? (
            <Text style={{ color: c.accent, fontSize: f.xs, fontWeight: "600" }}>
              {storms.dataUpdatedAt ? t("app.offlineDataAt", { time: formatTimeDateGmt7(new Date(storms.dataUpdatedAt)) }) : t("app.offline")}
            </Text>
          ) : (
            <View accessibilityLabel={t("app.online")} style={[styles.dot, { backgroundColor: c.live }]} />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("theme.toggle")}
            onPress={() => setTheme(name === "ink" ? "light" : "ink")}
            style={styles.iconBtn}
          >
            {name === "ink" ? <Sun color={c.muted} size={20} /> : <Moon color={c.muted} size={20} />}
          </Pressable>
        </View>
      </View>

      {/* M-02 Băng cảnh báo — luôn trong khung (UC-01 4a) */}
      <Pressable
        onPress={() => storm && router.push("/bao")}
        accessibilityRole="button"
        style={[styles.band, { backgroundColor: bandBg, borderColor: hasDanger ? bandBg : c.divider }]}
      >
        <TriangleAlert color={hasDanger ? "#fff" : s.kind === "affected" ? c.accent : c.muted} size={18} />
        <Text style={{ color: bandFg, fontSize: f.md, fontWeight: "600", flex: 1 }}>{bandText}</Text>
        {storm && <ChevronRight color={bandFg} size={18} />}
      </Pressable>

      {/* M-03 Thanh phân mức — bấm để lọc */}
      <View style={styles.counters}>
        {LEVELS.map((lv) => {
          const on = filter === lv;
          return (
            <Pressable
              key={lv}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${t(`counterLabels.${lv}`)}: ${watchlist.counts[lv]}`}
              onPress={() => {
                setFilter(on ? null : lv);
                setSheetOpen(true);
              }}
              style={[styles.counter, { backgroundColor: on ? c.surface2 : "transparent", borderColor: on ? c.primary : c.divider }]}
            >
              <View style={styles.rowCenter}>
                <RiskSymbol level={lv} size={11} />
                <Text style={{ color: lv === "danger" && watchlist.counts.danger > 0 ? c.accent : c.text, fontSize: f.xl, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                  {watchlist.counts[lv]}
                </Text>
              </View>
              <Text style={{ color: c.muted, fontSize: f.xs }}>{t(`counterLabels.${lv}`)}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* M-04 Bản đồ */}
      <View style={{ flex: 1, minHeight: 200 }}>
        <StormMap
          storm={storm}
          vessels={watchlist.vessels}
          view={view}
          selectedVesselId={selected}
          onVesselPick={(id) => {
            setSelected(id);
            router.push({ pathname: "/ghe/[id]", params: { id } });
          }}
          onStormPick={() => router.push("/bao")}
        />
      </View>

      {/* M-05 Danh sách ghe — thu gọn mặc định (bản 1.4) */}
      <View style={[styles.sheet, { backgroundColor: c.surface, borderTopColor: c.divider }]}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: sheetOpen }} onPress={() => setSheetOpen((o) => !o)} style={styles.sheetHead}>
          <Text style={{ color: c.text, fontSize: f.md, fontWeight: "700" }}>
            {t("vesselList.title")} · {watchlist.vessels.length}
            {filter ? <Text style={{ color: c.muted, fontWeight: "500" }}> · {t(`counterLabels.${filter}`)}</Text> : null}
          </Text>
          {sheetOpen ? <ChevronDown color={c.muted} size={20} /> : <ChevronUp color={c.muted} size={20} />}
        </Pressable>
        {sheetOpen && (
          <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 12 }}>
            {watchlist.vessels.length === 0 ? (
              <View style={{ gap: 12, paddingVertical: 8 }}>
                <Text style={{ color: c.muted, fontSize: f.sm }}>{t("vessel.empty")}</Text>
                <Button label={t("vessel.emptyCta")} onPress={() => router.push("/them-ghe")} />
              </View>
            ) : (
              <>
                {list.map((v) => (
                  <VesselRow key={v.id} v={v} storm={storm} onPress={() => router.push({ pathname: "/ghe/[id]", params: { id: v.id } })} />
                ))}
                <Button kind="secondary" label={t("vessel.add")} onPress={() => router.push("/them-ghe")} style={{ marginTop: 12 }} />
                <Text style={{ color: c.muted, fontSize: f.xs, marginTop: 10 }}>{t("app.disclaimerShort")}</Text>
              </>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingHorizontal: GUTTER, paddingTop: 6, paddingBottom: 8 },
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  band: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: GUTTER, paddingHorizontal: 12, minHeight: 44, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  counters: { flexDirection: "row", gap: 6, paddingHorizontal: GUTTER, paddingVertical: 8 },
  counter: { flex: 1, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 6, paddingHorizontal: 8, minHeight: 52 },
  sheet: { borderTopWidth: StyleSheet.hairlineWidth },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: GUTTER, minHeight: 48 },
});
