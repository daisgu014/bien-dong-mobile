// Trang nguồn dữ liệu & giấy phép — sinh từ registry của web (docs/data-sources.md §3.5). App chỉ dùng nguồn đang bật.
import * as WebBrowser from "expo-web-browser";
import { StyleSheet, Text, View } from "react-native";
import { isOfficialVn, isSourceUsable, listSources } from "@/modules/sources";
import { t } from "@/shared/i18n";
import { BackHeader } from "~/components/back-header";
import { Disclaimer } from "~/components/source-attribution";
import { Note, Screen, Title } from "~/components/ui";
import { useTheme } from "~/theme/use-theme";

const POLICY = { commercialMode: false, hasPaidKey: () => false, disabledIds: new Set<string>() };

export default function SourcesScreen() {
  const { c, f } = useTheme();
  return (
    <Screen>
      <BackHeader />
      <Title>{t("source.page.title")}</Title>
      <Text style={{ color: c.muted, fontSize: f.sm, lineHeight: f.sm * 1.45 }}>{t("source.page.intro")}</Text>
      {listSources().map((s) => {
        const on = isSourceUsable(s, POLICY);
        return (
          <View key={s.id} style={[styles.item, { borderBottomColor: c.divider }]}>
            <Text style={{ color: c.text, fontSize: f.md, fontWeight: "600" }}>
              {s.shortName} <Text style={{ color: c.muted, fontWeight: "400", fontSize: f.xs }}>{s.id}</Text>
            </Text>
            <Text style={{ color: c.muted, fontSize: f.sm }}>{s.role}</Text>
            <Text style={{ color: c.muted, fontSize: f.xs }}>
              {isOfficialVn(s) ? t("source.official") : t("source.reference")} · {on ? t("source.page.enabled") : t("source.page.disabled")} · {t("source.page.colChecked")}{" "}
              {s.termsCheckedAt}
            </Text>
            <Text style={{ color: c.text, fontSize: f.xs }}>{s.attributionText.vi}</Text>
            {s.licenseUrl ? (
              <Text accessibilityRole="link" onPress={() => void WebBrowser.openBrowserAsync(s.licenseUrl as string)} style={{ color: c.primaryText, fontSize: f.xs, textDecorationLine: "underline" }}>
                {s.licenseName}
              </Text>
            ) : (
              <Text style={{ color: c.muted, fontSize: f.xs }}>{s.licenseName}</Text>
            )}
          </View>
        );
      })}
      <Note>{t("footer.nonCommercial")}</Note>
      <View style={{ marginTop: 12 }}>
        <Disclaimer />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ item: { paddingVertical: 12, gap: 3, borderBottomWidth: StyleSheet.hairlineWidth } });
