// S-08 — tab CÀI ĐẶT (BA-BD-002 §2.4): chỉ tuỳ chọn trên thiết bị. Không tài khoản/thông báo đẩy (không có máy chủ riêng).
// TODO(BA-BD-002 §12): UC-11/UC-16 khi có đăng nhập.
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import type { FlatMapView } from "@/modules/map";
import { t } from "@/shared/i18n";
import { Disclaimer } from "~/components/source-attribution";
import { Note, Screen, SectionLabel, Title } from "~/components/ui";
import { THRESHOLD_OPTIONS, useSettings } from "~/lib/settings-store";
import { useStorms } from "~/lib/queries";
import { useVesselStore } from "~/lib/vessel-store";
import { useTheme } from "~/theme/use-theme";

function Choice<T>({ options, value, onChange }: { options: Array<{ v: T; label: string }>; value: T; onChange: (v: T) => void }) {
  const { c, f } = useTheme();
  return (
    <View style={styles.choices}>
      {options.map((o) => {
        const on = o.v === value;
        return (
          <Pressable
            key={o.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(o.v)}
            style={[styles.choice, { borderColor: on ? c.primary : c.border, backgroundColor: on ? c.surface2 : "transparent" }]}
          >
            <Text style={{ color: on ? c.text : c.muted, fontSize: f.sm, fontWeight: on ? "700" : "500" }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { c, f } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: c.divider }]}>
      <Text style={{ color: c.text, fontSize: f.md, flex: 1 }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} />
    </View>
  );
}

export default function SettingsTab() {
  const { c, f, name } = useTheme();
  const s = useSettings();
  const vessels = useVesselStore((x) => x.vessels);
  const clear = useVesselStore((x) => x.clear);
  const storms = useStorms();

  const confirmClear = () =>
    Alert.alert(t("settings.clearTitle"), t("settings.clearBody"), [
      { text: t("settings.cancel"), style: "cancel" },
      { text: t("settings.clearConfirm"), style: "destructive", onPress: clear },
    ]);

  return (
    <Screen>
      <Title>{t("settings.title")}</Title>

      <SectionLabel>{t("settings.display")}</SectionLabel>
      <SwitchRow label={t("settings.themeLight")} value={name === "light"} onChange={(v) => s.setTheme(v ? "light" : "ink")} />
      <SwitchRow label={t("settings.largeText")} value={s.largeText} onChange={s.setLargeText} />
      <Text style={{ color: c.muted, fontSize: f.xs, marginTop: 12 }}>{t("view.eyebrow")}</Text>
      <Choice<FlatMapView>
        value={s.mapView}
        onChange={s.setMapView}
        options={[
          { v: "sea", label: t("view.sea") },
          { v: "coast", label: t("view.coast") },
          { v: "wide", label: t("view.wide") },
        ]}
      />

      <SectionLabel>{t("settings.alerts")}</SectionLabel>
      <Text style={{ color: c.text, fontSize: f.md }}>{t("settings.threshold")}</Text>
      <Choice
        value={s.thresholdKm}
        onChange={s.setThresholdKm}
        options={THRESHOLD_OPTIONS.map((v) => ({ v, label: v === null ? t("settings.thresholdOff") : t("settings.km", { n: v }) }))}
      />
      <Note>{t("settings.thresholdHint")}</Note>

      <SectionLabel>{t("settings.data")}</SectionLabel>
      <Text style={{ color: c.text, fontSize: f.md }}>
        {vessels.length > 0 ? t("settings.localCount", { n: vessels.length, p: vessels.filter((v) => v.positionMethod === "manual").length }) : t("settings.localNone")}
      </Text>
      <Note>{t("settings.localNote")}</Note>
      {vessels.length > 0 && (
        <Pressable accessibilityRole="button" onPress={confirmClear} style={[styles.row, { borderBottomColor: c.divider }]}>
          <Text style={{ color: c.accent, fontSize: f.md }}>{t("settings.clearLocal")}</Text>
        </Pressable>
      )}

      <SectionLabel>{t("settings.connection")}</SectionLabel>
      <Text style={{ color: storms.isError ? c.accent : c.text, fontSize: f.md }}>{storms.isError ? t("settings.offline") : t("settings.online")}</Text>

      <SectionLabel>{t("settings.about")}</SectionLabel>
      <Pressable accessibilityRole="link" onPress={() => router.push("/nguon-du-lieu")} style={[styles.row, { borderBottomColor: c.divider }]}>
        <Text style={{ color: c.text, fontSize: f.md, flex: 1 }}>{t("settings.sources")}</Text>
        <ChevronRight color={c.muted} size={18} />
      </Pressable>
      <Note>{t("footer.nonCommercial")}</Note>
      <View style={{ marginTop: 12 }}>
        <Disclaimer />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  choice: { minHeight: 44, minWidth: 64, paddingHorizontal: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
});
