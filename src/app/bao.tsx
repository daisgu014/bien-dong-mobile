// S-05 — chi tiết bão (mobile). UC-03. Ô thiếu dữ liệu → "Nguồn không cung cấp" (BR-01). Ghi nguồn một lần + tuyên bố (GAP-09).
import { StyleSheet, Text, View } from "react-native";
import { formatTrackTimeGmt7 } from "@/shared/format/gmt7";
import { formatCoord, formatKm } from "@/shared/format/units";
import { t } from "@/shared/i18n";
import { BackHeader } from "~/components/back-header";
import { Disclaimer, SourceAttribution } from "~/components/source-attribution";
import { KeyValue, Note, Screen, SectionLabel, Title } from "~/components/ui";
import { radiusLabels } from "~/lib/format";
import { useWatchlist } from "~/lib/use-watchlist";
import { useTheme } from "~/theme/use-theme";

export default function StormScreen() {
  const { c, f } = useTheme();
  const { watchlist, primaryMeta } = useWatchlist();
  const storm = watchlist.primary;
  const np = t("app.notProvided");

  if (!storm) {
    return (
      <Screen>
        <BackHeader />
        <Title>{t("status.noStorm")}</Title>
        <Disclaimer />
      </Screen>
    );
  }
  const rl = radiusLabels(storm);
  return (
    <Screen>
      <BackHeader />
      <Title sub={storm.nameIntl}>{`${storm.codeVn} — ${storm.nameVn}`}</Title>
      {storm.stamp.isFallback && <Note tone="danger">{t("source.fallbackBanner", { name: storm.stamp.sourceName })}</Note>}
      {primaryMeta?.stale && <Note tone="danger">{t("source.staleAt", { time: formatTrackTimeGmt7(storm.stamp.issuedAt) })}</Note>}

      {storm.landfall && (
        <View style={[styles.landfall, { backgroundColor: c.accent700 }]}>
          <Text style={{ color: "#fff", fontSize: f.xs, fontWeight: "600" }}>{t("storm.landfall")}</Text>
          <Text style={{ color: "#fff", fontSize: f.lg, fontWeight: "700" }}>{storm.landfall.areaVn}</Text>
          {storm.landfall.at && <Text style={{ color: "#fff", fontSize: f.sm }}>{formatTrackTimeGmt7(storm.landfall.at)} GMT+7</Text>}
        </View>
      )}

      <SectionLabel>{t("storm.activeEyebrow")}</SectionLabel>
      <KeyValue label={t("storm.grid.category")} value={storm.category !== null ? t("forecast.level", { n: storm.category }) : np} strong />
      <KeyValue label={t("storm.grid.gust")} value={storm.gust !== null ? t("forecast.level", { n: storm.gust }) : np} />
      <KeyValue label={t("storm.grid.pressure")} value={storm.pressureHpa !== null ? `${storm.pressureHpa} hPa` : np} />
      <KeyValue
        label={t("storm.grid.move")}
        value={storm.moveSpeedKmh !== null ? `${storm.moveSpeedKmh} km/h ${storm.moveDirVn ?? ""}`.trim() : np}
      />
      <KeyValue label={rl.gale} value={storm.radiusGaleKm !== null ? formatKm(storm.radiusGaleKm) : np} />
      <KeyValue label={rl.storm} value={storm.radiusStormKm !== null ? formatKm(storm.radiusStormKm) : np} />
      {storm.radiusThresholdKt && <Note>{t("source.jmaThreshold")}</Note>}
      {storm.windAveragingMinutes ? <Note>{t("systems.windAveraging", { n: storm.windAveragingMinutes, name: storm.stamp.sourceName })}</Note> : null}

      <SectionLabel>{t("storm.track")}</SectionLabel>
      {storm.track.map((p) => (
        <View key={`${p.kind}-${p.at}`} style={[styles.trackRow, { borderBottomColor: c.divider }]}>
          <View
            style={[
              styles.mark,
              p.kind === "past" ? { backgroundColor: c.text } : p.kind === "now" ? { backgroundColor: c.accent } : { borderWidth: 1.5, borderColor: c.text },
            ]}
          />
          <Text style={{ color: c.text, fontSize: f.sm, width: 92, fontVariant: ["tabular-nums"] }}>{formatTrackTimeGmt7(p.at)}</Text>
          <Text style={{ color: c.muted, fontSize: f.sm, flex: 1, fontVariant: ["tabular-nums"] }}>{formatCoord(p.lat, p.lon, 1)}</Text>
          <Text style={{ color: c.text, fontSize: f.sm, fontWeight: "600" }}>{p.category !== null ? `C${p.category}` : "—"}</Text>
        </View>
      ))}

      <View style={{ marginTop: 24, gap: 10 }}>
        <SourceAttribution attribution={storm.stamp} stale={primaryMeta?.stale} fallback={storm.stamp.isFallback} />
        <Disclaimer />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  landfall: { borderRadius: 12, padding: 12, marginTop: 12, gap: 2 },
  trackRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 40, borderBottomWidth: StyleSheet.hairlineWidth },
  mark: { width: 9, height: 9 },
});
