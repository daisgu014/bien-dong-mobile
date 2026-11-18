// S-07 — tab DỰ BÁO (BA-BD-002 §2.4), bản đầu trên app: Sắp tới (16 ngày, DS-05 Forecast) và Trên biển (7 ngày, DS-05 Marine + Forecast).
// Thiếu giá trị → "Nguồn không cung cấp"/"—", không nội suy (BR-01). Chưa có: theo giờ, xu hướng 17–30, đã qua, triều cường (làm sau).
import { ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SEA_AREAS, WEATHER_REGIONS, dateGmt7, weatherKind, weekday, type DailyWeatherRow, type SeaDayRow } from "@/modules/forecast";
import { formatCoord } from "@/shared/format/units";
import { t } from "@/shared/i18n";
import { PickerSheet } from "~/components/picker-sheet";
import { Disclaimer, SourceAttribution } from "~/components/source-attribution";
import { Loading, Note, Screen, UnderlineTabs } from "~/components/ui";
import { useDailyWeather, useSeaForecast } from "~/lib/queries";
import { useTheme } from "~/theme/use-theme";

type Tab = "upcoming" | "sea";

const dash = "—";
const deg = (n: number | null) => (n === null ? dash : `${Math.round(n)}°`);

function dayName(date: string, today: string): string {
  if (date === today) return t("weather.today");
  return t(`weather.weekday.d${weekday(date)}` as "weather.weekday.d0");
}
const dm = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

function kindText(code: number | null, isDay: boolean | null = true): string {
  const k = weatherKind(code);
  if (k === "clear" && isDay === false) return t("weather.kind.clearNight");
  return t(`weather.kind.${k}`);
}

function DayRow({ r, today }: { r: DailyWeatherRow; today: string }) {
  const { c, f } = useTheme();
  const strongWind = (r.windLevel ?? 0) >= 6 || (r.gustLevel ?? 0) >= 8;
  return (
    <View style={[styles.row, { borderBottomColor: c.divider }]}>
      <View style={{ width: 70 }}>
        <Text style={{ color: c.text, fontSize: f.md, fontWeight: "600" }}>{dayName(r.date, today)}</Text>
        <Text style={{ color: c.muted, fontSize: f.xs }}>{dm(r.date)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: f.sm }} numberOfLines={1}>
          {kindText(r.weatherCode)}
        </Text>
        <Text style={{ color: c.muted, fontSize: f.xs, fontWeight: strongWind ? "700" : "400" }} numberOfLines={1}>
          {[
            r.rainProbPct !== null && r.rainProbPct >= 10 ? `${t("weather.rainLabel")} ${r.rainProbPct}%` : null,
            r.windLevel !== null ? `${t("weather.windShort", { n: r.windLevel })}${r.gustLevel !== null ? `, ${t("weather.gust", { n: r.gustLevel })}` : ""}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
      <Text style={{ color: c.text, fontSize: f.md, fontWeight: "600", fontVariant: ["tabular-nums"] }}>
        {deg(r.tMaxC)} <Text style={{ color: c.muted, fontWeight: "400" }}>{deg(r.tMinC)}</Text>
      </Text>
    </View>
  );
}

function SeaRow({ r, today }: { r: SeaDayRow; today: string }) {
  const { c, f } = useTheme();
  const strongWind = (r.windLevel ?? 0) >= 6 || (r.gustLevel ?? 0) >= 8; // in đậm, không dùng đỏ (đỏ chỉ cho bão)
  return (
    <View style={[styles.row, { borderBottomColor: c.divider }]}>
      <View style={{ width: 70 }}>
        <Text style={{ color: c.text, fontSize: f.md, fontWeight: "600" }}>{dayName(r.date, today)}</Text>
        <Text style={{ color: c.muted, fontSize: f.xs }}>{dm(r.date)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: f.sm }}>
          {r.waveMaxM !== null ? t("sea.m", { n: r.waveMaxM.toFixed(1) }) : dash}
          {r.swellMaxM !== null ? <Text style={{ color: c.muted }}> · {t("sea.swell", { n: t("sea.m", { n: r.swellMaxM.toFixed(1) }) })}</Text> : null}
        </Text>
        <Text style={{ color: c.muted, fontSize: f.xs, fontWeight: strongWind ? "700" : "400" }}>
          {r.windLevel !== null
            ? `${t("weather.windShort", { n: r.windLevel })}${r.gustLevel !== null ? `, ${t("weather.gust", { n: r.gustLevel })}` : ""}${r.windDir ? ` · ${r.windDir}` : ""}`
            : t("sea.noWind")}
        </Text>
      </View>
    </View>
  );
}

export default function ForecastTab() {
  const { c, f } = useTheme();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [regionId, setRegionId] = useState(WEATHER_REGIONS[0]!.id);
  const [seaId, setSeaId] = useState(SEA_AREAS[0]!.id);
  const [picker, setPicker] = useState(false);
  const daily = useDailyWeather(regionId);
  const sea = useSeaForecast(seaId);
  const today = dateGmt7(new Date());

  const region = WEATHER_REGIONS.find((r) => r.id === regionId)!;
  const area = SEA_AREAS.find((a) => a.id === seaId)!;
  const placeName = tab === "upcoming" ? region.name : area.name;

  const d = daily.data;
  const todayRow = d?.rows.find((r) => r.date === today) ?? null;

  return (
    <Screen>
      <Pressable onPress={() => setPicker(true)} accessibilityRole="button" accessibilityLabel={t("weather.pick.title")} style={styles.place}>
        <Text style={{ color: c.text, fontSize: f.xxl, fontWeight: "700", letterSpacing: -0.3 }} numberOfLines={1}>
          {placeName}
        </Text>
        <ChevronDown color={c.muted} size={22} />
      </Pressable>
      <UnderlineTabs<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { id: "upcoming", label: t("weather.tabUpcoming") },
          { id: "sea", label: t("weather.tabSea") },
        ]}
      />

      {tab === "upcoming" &&
        (daily.isPending ? (
          <Loading label={t("weather.loading")} />
        ) : !d ? (
          <Note>{t("weather.none")}</Note>
        ) : (
          <>
            <View style={{ paddingVertical: 16 }}>
              <Text style={{ color: c.text, fontSize: 56, fontWeight: "300", fontVariant: ["tabular-nums"] }}>{deg(d.current?.tempC ?? null)}</Text>
              <Text style={{ color: c.text, fontSize: f.md }}>{kindText(d.current?.weatherCode ?? null, d.current?.isDay ?? null)}</Text>
              {todayRow && <Text style={{ color: c.muted, fontSize: f.sm }}>{t("weather.highLow", { max: deg(todayRow.tMaxC), min: deg(todayRow.tMinC) })}</Text>}
            </View>
            <Text style={{ color: c.muted, fontSize: f.xs, fontWeight: "600", marginBottom: 4 }}>{t("weather.days16")}</Text>
            {d.rows.map((r) => (
              <DayRow key={r.date} r={r} today={today} />
            ))}
            <View style={{ marginTop: 16 }}>
              <SourceAttribution attribution={d.attribution} />
            </View>
          </>
        ))}

      {tab === "sea" &&
        (sea.isPending ? (
          <Loading label={t("sea.loading")} />
        ) : !sea.data ? (
          <Note>{t("sea.none")}</Note>
        ) : (
          <>
            <Text style={{ color: c.muted, fontSize: f.xs, marginTop: 10 }}>{t("sea.areaHint", { coord: formatCoord(area.lat, area.lon, 1) })}</Text>
            {sea.data.noWaveData && <Note>{t("sea.noWave")}</Note>}
            <View style={{ marginTop: 8 }}>
              {sea.data.rows.map((r) => (
                <SeaRow key={r.date} r={r} today={today} />
              ))}
            </View>
            <Note>{t("sea.note")}</Note>
            <View style={{ marginTop: 12 }}>
              <SourceAttribution attribution={sea.data.attribution} />
            </View>
          </>
        ))}

      <View style={{ marginTop: 12 }}>
        <Disclaimer />
      </View>

      <PickerSheet
        visible={picker}
        title={tab === "upcoming" ? t("weather.pick.title") : t("sea.pickTitle")}
        searchPlaceholder={tab === "upcoming" ? t("weather.pick.search") : t("sea.search")}
        items={tab === "upcoming" ? WEATHER_REGIONS.map((r) => ({ id: r.id, name: r.name, hint: t("weather.regionHint", { center: r.center }) })) : SEA_AREAS.map((a) => ({ id: a.id, name: a.name }))}
        selectedId={tab === "upcoming" ? regionId : seaId}
        onPick={tab === "upcoming" ? setRegionId : setSeaId}
        onClose={() => setPicker(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  place: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 12, minHeight: 44 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 56, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
});
