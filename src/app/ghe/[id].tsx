// S-04 — chi tiết ghe (UC-08): mức + diễn giải, khoảng cách, chỉ số, hành trình (giờ thật từng điểm, GAP-11), cập nhật vị trí, tạm dừng, xoá.
import { router, useLocalSearchParams } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";
import { formatTimeDateGmt7, formatTimeGmt7 } from "@/shared/format/gmt7";
import { formatCoord, formatDegrees, formatKnots } from "@/shared/format/units";
import { t } from "@/shared/i18n";
import { BackHeader } from "~/components/back-header";
import { RiskLabel } from "~/components/risk-label";
import { Disclaimer, SourceAttribution } from "~/components/source-attribution";
import { Button, KeyValue, Note, Screen, SectionLabel } from "~/components/ui";
import { distanceText, etaLabel, etaText, reasonText } from "~/lib/format";
import { useWatchlist } from "~/lib/use-watchlist";
import { useVesselStore } from "~/lib/vessel-store";
import { useTheme } from "~/theme/use-theme";

const FLAG_KEYS = { unverified: "risk.flag.unverified", stale: "risk.flag.stale", too_old_for_danger: "risk.flag.too_old_for_danger", lost_signal: "risk.flag.lost_signal" } as const;

export default function VesselDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, f } = useTheme();
  const { watchlist, primaryMeta } = useWatchlist();
  const remove = useVesselStore((s) => s.remove);
  const setPaused = useVesselStore((s) => s.setPaused);
  const v = watchlist.vessels.find((x) => x.id === id);

  if (!v) {
    return (
      <Screen>
        <BackHeader />
        <Text style={{ color: c.muted, fontSize: f.md, marginTop: 16 }}>{t("addVessel.notFound")}</Text>
      </Screen>
    );
  }
  const r = v.risk;
  const storm = watchlist.primary;
  const pos = v.lastPosition;
  const paused = v.status === "paused";
  const flags = [...new Set(r.flags.map((x) => t(FLAG_KEYS[x])))];
  const meta = [v.type, v.lengthM !== null ? `${v.lengthM} m` : null, v.crewCount !== null ? `${v.crewCount} thuyền viên` : null].filter(Boolean).join(" · ");

  const doDelete = () => {
    remove(v.id);
    router.back();
  };
  // UC-09 2a: ghe NGUY HIỂM hỏi xác nhận lần hai.
  const confirmDelete = () =>
    Alert.alert(t("vesselScreen.deleteTitle", { regNo: v.regNo }), t("vesselScreen.deleteMessage"), [
      { text: t("vesselScreen.cancel"), style: "cancel" },
      {
        text: t("vesselScreen.confirmDelete"),
        style: "destructive",
        onPress: () =>
          r.level === "danger"
            ? Alert.alert(t("vesselScreen.deleteDangerTitle"), t("vesselScreen.deleteDangerMessage", { regNo: v.regNo }), [
                { text: t("vesselScreen.cancel"), style: "cancel" },
                { text: t("vesselScreen.confirmDeleteAnyway"), style: "destructive", onPress: doDelete },
              ])
            : doDelete(),
      },
    ]);

  const trail = [...v.trail].reverse();

  return (
    <Screen>
      <BackHeader />
      <Text style={{ color: c.text, fontSize: f.xxl, fontWeight: "700", marginTop: 4 }}>{v.regNo}</Text>
      {v.label ? <Text style={{ color: c.muted, fontSize: f.sm }}>{v.label}</Text> : null}
      <Text style={{ color: c.muted, fontSize: f.sm, marginTop: 2 }}>{meta}</Text>
      <View style={styles.levelRow}>
        {paused ? <Text style={{ color: c.muted, fontSize: f.sm, fontWeight: "600" }}>{t("vesselList.paused")}</Text> : <RiskLabel level={r.level} />}
        {flags.map((x) => (
          <Text key={x} style={{ color: c.risk.warn.tagFg, fontSize: f.xs, fontWeight: "600" }}>
            {x}
          </Text>
        ))}
      </View>
      <Text style={{ color: c.text, fontSize: f.sm, marginTop: 4 }}>{reasonText(r, storm)}</Text>

      {storm && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ color: c.muted, fontSize: f.xs }}>{t("vessel.distanceLabel")}</Text>
          <Text style={{ color: r.level === "danger" ? c.accent : c.text, fontSize: 44, fontWeight: "700", fontVariant: ["tabular-nums"] }}>{distanceText(r)}</Text>
        </View>
      )}

      <SectionLabel>{t("vessel.selectedEyebrow")}</SectionLabel>
      {storm && <KeyValue label={etaLabel(storm)} value={etaText(r)} strong />}
      <KeyValue label={t("vessel.detail.positionSource")} value={t(`vessel.source.${pos?.source ?? v.positionMethod}`)} />
      <KeyValue label={t("vessel.detail.coord")} value={pos ? formatCoord(pos.lat, pos.lon) : t("app.dash")} />
      <KeyValue label={t("vessel.detail.speed")} value={formatKnots(pos?.speedKn)} />
      <KeyValue label={t("vessel.detail.course")} value={formatDegrees(pos?.courseDeg)} />
      <KeyValue label={t("vessel.detail.updated")} value={pos ? `${formatTimeDateGmt7(pos.at)} GMT+7` : t("app.dash")} />
      {storm && r.etaGaleHours !== null && r.etaGaleHours !== "inside" && <Note>{t("risk.etaRef")}</Note>}

      <SectionLabel>{t("vessel.trail")}</SectionLabel>
      {trail.length <= 1 && <Note>{t("vessel.trailOnlyOne")}</Note>}
      {trail.map((p, i) => (
        <View key={p.at} style={[styles.trailRow, { borderBottomColor: c.divider }]}>
          <Text style={{ color: c.text, fontSize: f.sm, width: 52, fontVariant: ["tabular-nums"] }}>{formatTimeGmt7(p.at)}</Text>
          <Text style={{ color: c.muted, fontSize: f.sm, flex: 1, fontVariant: ["tabular-nums"] }}>{formatCoord(p.lat, p.lon)}</Text>
          <Text style={{ color: c.muted, fontSize: f.xs }}>{i === 0 ? t("vessel.trailLatest") : ""}</Text>
        </View>
      ))}

      <View style={{ gap: 10, marginTop: 20 }}>
        <Button label={t("vessel.actionManual")} onPress={() => router.push({ pathname: "/them-ghe", params: { mode: "position", vesselId: v.id } })} />
        <Button kind="secondary" label={paused ? t("vesselList.resume") : t("vesselList.pause")} onPress={() => setPaused(v.id, !paused)} />
        {!paused && <Note>{t("vesselList.pauseHint")}</Note>}
        <Button kind="danger" label={t("vesselScreen.delete")} onPress={confirmDelete} />
      </View>

      <View style={{ marginTop: 24, gap: 8 }}>
        {storm && <SourceAttribution attribution={storm.stamp} stale={primaryMeta?.stale} fallback={storm.stamp.isFallback} compact />}
        <Disclaimer />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  levelRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" },
  trailRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 40, borderBottomWidth: StyleSheet.hairlineWidth },
});
