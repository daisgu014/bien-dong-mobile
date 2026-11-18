// S-06 — tab GHE (UC-09): danh sách §5.4 (tạm dừng xuống cuối), tìm theo số hiệu/nhãn (BR-13), thêm ghe → S-03.
import { router } from "expo-router";
import { Search } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { matchesRegNo, WATCHLIST_LIMIT } from "@/modules/vessel";
import { t } from "@/shared/i18n";
import { Disclaimer, SourceAttribution } from "~/components/source-attribution";
import { Button, Screen, Title } from "~/components/ui";
import { VesselRow } from "~/components/vessel-row";
import { useWatchlist } from "~/lib/use-watchlist";
import { useTheme } from "~/theme/use-theme";

export default function VesselsTab() {
  const { c, f } = useTheme();
  const { watchlist, primaryMeta } = useWatchlist();
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const list = query ? watchlist.vessels.filter((v) => matchesRegNo(q, v.regNoNormalized) || (v.label ?? "").toLowerCase().includes(query)) : watchlist.vessels;
  const full = watchlist.vessels.length >= WATCHLIST_LIMIT;

  return (
    <Screen>
      <Title sub={t("vesselList.count", { n: watchlist.vessels.length, max: WATCHLIST_LIMIT })}>{t("vesselList.title")}</Title>
      <View style={[styles.search, { borderColor: c.border, backgroundColor: c.surface }]}>
        <Search color={c.muted} size={18} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t("vesselList.search")}
          placeholderTextColor={c.muted}
          style={{ flex: 1, color: c.text, fontSize: f.md, minHeight: 44 }}
          autoCapitalize="characters"
          accessibilityLabel={t("vesselList.search")}
        />
      </View>
      <Button label={t("vesselList.add")} onPress={() => router.push("/them-ghe")} disabled={full} style={{ marginTop: 12 }} />
      {full && <Text style={{ color: c.muted, fontSize: f.xs, marginTop: 6 }}>{t("addVessel.limit", { n: WATCHLIST_LIMIT })}</Text>}

      <View style={{ marginTop: 12 }}>
        {watchlist.vessels.length === 0 ? (
          <Text style={{ color: c.muted, fontSize: f.sm, paddingVertical: 12 }}>{t("vesselList.empty")}</Text>
        ) : list.length === 0 ? (
          <Text style={{ color: c.muted, fontSize: f.sm, paddingVertical: 12 }}>{t("vesselList.noMatch")}</Text>
        ) : (
          list.map((v) => <VesselRow key={v.id} v={v} storm={watchlist.primary} onPress={() => router.push({ pathname: "/ghe/[id]", params: { id: v.id } })} />)
        )}
      </View>

      {/* Khoảng cách tính theo bão → ghi nguồn bão + tuyên bố (S-06). */}
      <View style={{ marginTop: 20, gap: 8 }}>
        {watchlist.primary && <SourceAttribution attribution={watchlist.primary.stamp} stale={primaryMeta?.stale} fallback={watchlist.primary.stamp.isFallback} compact />}
        <Disclaimer />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 12, marginTop: 8 },
});
