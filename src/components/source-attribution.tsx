import * as WebBrowser from "expo-web-browser";
import { Text } from "react-native";
import type { Attribution } from "@/modules/risk";
import { getSource, isOfficialVn } from "@/modules/sources";
import { formatGmt7 } from "@/shared/format/gmt7";
import { t } from "@/shared/i18n";
import { useTheme } from "~/theme/use-theme";

interface Props {
  attribution: Attribution;
  /** BR-02 — dữ liệu cũ. */
  stale?: boolean;
  /** Nguồn dự phòng (isFallback). */
  fallback?: boolean;
  /** Một dòng, không giấy phép. */
  compact?: boolean;
}

/**
 * Ghi nguồn bắt buộc ở mọi nơi hiển thị dữ liệu ngoài (CLAUDE.md quy tắc 1, BR-01, BR-23) — bản React Native của
 * src/modules/sources/ui/source-attribution.tsx, cùng nội dung: nhãn chính thức/tham khảo, tên nguồn (link bản tin gốc),
 * giờ bản tin GMT+7, "chưa cập nhật", ghi chú đã chuyển đổi, giấy phép.
 */
export function SourceAttribution({ attribution, stale = false, fallback = false, compact = false }: Props) {
  const { c, f } = useTheme();
  const src = getSource(attribution.sourceId);
  const official = isOfficialVn(src);
  const open = (url: string) => void WebBrowser.openBrowserAsync(url);
  return (
    <Text testID="source-attribution" style={{ color: c.muted, fontSize: f.xs, lineHeight: f.xs * 1.45 }}>
      <Text style={{ fontWeight: "600", color: official ? c.live : c.muted }}>{official ? t("source.official") : t("source.reference")}</Text>
      {" · "}
      {fallback && <Text style={{ color: c.accent, fontWeight: "600" }}>{t("source.fallbackBanner", { name: src.shortName })} · </Text>}
      <Text accessibilityRole="link" style={{ textDecorationLine: "underline" }} onPress={() => open(attribution.sourceUrl)}>
        {src.attributionText.vi}
      </Text>
      {src.attributionText.original ? ` · ${src.attributionText.original}` : ""}
      {attribution.issuedAt ? ` · ${t("source.issued")} ${formatGmt7(attribution.issuedAt)}` : ""}
      {stale && <Text style={{ color: c.accent, fontWeight: "600" }}> · {t("source.stale")}</Text>}
      {src.requiresModificationNotice && attribution.modified ? ` · ${t("source.modified")}` : ""}
      {!compact && src.licenseUrl ? (
        <>
          {" · "}
          <Text accessibilityRole="link" style={{ textDecorationLine: "underline" }} onPress={() => open(src.licenseUrl as string)}>
            {src.licenseName}
          </Text>
        </>
      ) : null}
    </Text>
  );
}

/** Tuyên bố giới hạn trách nhiệm (GAP-09) — bắt buộc trên mobile. */
export function Disclaimer() {
  const { c, f } = useTheme();
  return <Text style={{ color: c.muted, fontSize: f.xs, lineHeight: f.xs * 1.45 }}>{t("app.disclaimer")}</Text>;
}
