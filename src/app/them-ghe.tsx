// S-03 — thêm ghe / cập nhật vị trí (UC-05 + UC-07, BA-BD-002 §2.4). Chưa kết nối VMS/AIS → vị trí nhập tay `unverified` (UC-05 3a).
// Kiểm tra: BR-08 (vùng + thời điểm), BR-13/14 (trùng), BR-15 (tối đa 20), UC-07 2a (trên đất liền) và 2b (> 20 hl/g) → phải tích xác nhận.
// Chưa có "chạm lên bản đồ để chọn vị trí" (UC-07 1b) trên app — TODO(BA-BD-002 §12).
import { geoContains } from "d3-geo";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View, type KeyboardTypeOptions } from "react-native";
import { assessVessel, type VesselPosition } from "@/modules/risk";
import {
  MAX_IMPLIED_SPEED_KN,
  NewVesselInputSchema,
  WATCHLIST_LIMIT,
  buildManualVessel,
  findDuplicate,
  impliedSpeedKn,
  validateManualPosition,
} from "@/modules/vessel";
import { formatTimeDateGmt7 } from "@/shared/format/gmt7";
import { t } from "@/shared/i18n";
import { BackHeader } from "~/components/back-header";
import { RiskLabel } from "~/components/risk-label";
import { Button, Note, Screen, SectionLabel, Title } from "~/components/ui";
import { BASEMAP } from "~/lib/basemap";
import { toPhoneTime, fromPhoneTime } from "~/lib/time-input";
import { useWatchlist } from "~/lib/use-watchlist";
import { newLocalVesselId, useVesselStore } from "~/lib/vessel-store";
import { useTheme } from "~/theme/use-theme";

function Field(props: { label: string; value: string; onChange: (s: string) => void; placeholder?: string; keyboard?: KeyboardTypeOptions; autoCaps?: "none" | "characters" }) {
  const { c, f } = useTheme();
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ color: c.muted, fontSize: f.xs, marginBottom: 4 }}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChange}
        placeholder={props.placeholder}
        placeholderTextColor={c.muted}
        keyboardType={props.keyboard}
        autoCapitalize={props.autoCaps ?? "none"}
        accessibilityLabel={props.label}
        style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surface, fontSize: f.md }]}
      />
    </View>
  );
}

const num = (s: string) => {
  const n = Number(s.replace(",", "."));
  return s.trim() === "" || !Number.isFinite(n) ? null : n;
};

export default function AddVesselScreen() {
  const { c, f } = useTheme();
  const params = useLocalSearchParams<{ mode?: string; vesselId?: string }>();
  const { watchlist, now } = useWatchlist();
  const add = useVesselStore((s) => s.add);
  const appendPosition = useVesselStore((s) => s.appendPosition);
  const target = params.mode === "position" ? (watchlist.vessels.find((v) => v.id === params.vesselId) ?? null) : null;
  const updating = target !== null;

  const [regNo, setRegNo] = useState("");
  const [label, setLabel] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [at, setAt] = useState(() => toPhoneTime(new Date()));
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const atIso = fromPhoneTime(at);
  const latN = num(lat);
  const lonN = num(lon);
  const point = latN !== null && lonN !== null ? { lat: latN, lon: lonN } : null;

  // UC-07 2a / 2b — cảnh báo cần xác nhận.
  const warnings = useMemo(() => {
    const out: string[] = [];
    if (!point) return out;
    if (geoContains(BASEMAP.land, [point.lon, point.lat])) out.push(t("addVessel.onLand"));
    if (target?.lastPosition && atIso) {
      const kn = impliedSpeedKn(target.lastPosition, { ...point, at: atIso });
      if (kn !== null && kn > MAX_IMPLIED_SPEED_KN) out.push(t("addVessel.fastMove", { kn: Number.isFinite(kn) ? Math.round(kn) : "∞" }));
    }
    return out;
  }, [point, atIso, target]);

  const duplicate = !updating && regNo.trim().length >= 3 ? findDuplicate(watchlist.vessels, regNo, null) : null;
  const full = !updating && watchlist.vessels.length >= WATCHLIST_LIMIT;

  // Bước 5 — xem trước mức nếu lưu (cùng risk-engine).
  const preview = useMemo(() => {
    if (!point || !atIso) return null;
    const pos: VesselPosition = { at: atIso, lat: point.lat, lon: point.lon, speedKn: null, courseDeg: null, source: "manual", confidence: "unverified" };
    const base = target ?? buildManualVessel("preview", { regNo: regNo || "preview" }, pos);
    return assessVessel({ ...base, lastPosition: pos }, watchlist.primary, now);
  }, [point, atIso, target, regNo, watchlist.primary, now]);

  const save = () => {
    const errs: string[] = [];
    const nowDate = new Date();
    if (!atIso) errs.push(t("addVessel.at"));
    const pv = validateManualPosition({ lat: latN, lon: lonN, at: atIso ?? "" }, nowDate);
    if (!pv.ok) errs.push(...pv.errors);
    if (target?.lastPosition && atIso && atIso <= target.lastPosition.at) errs.push(t("addVessel.notAfterLast", { time: formatTimeDateGmt7(target.lastPosition.at) }));
    let input = null;
    if (!updating) {
      const parsed = NewVesselInputSchema.safeParse({ regNo, label: label.trim() || null });
      if (!parsed.success) errs.push(...parsed.error.issues.map((i) => i.message));
      else input = parsed.data;
      if (duplicate) errs.push(t("addVessel.duplicate"));
      if (full) errs.push(t("addVessel.limit", { n: WATCHLIST_LIMIT }));
    }
    if (warnings.length > 0 && !confirmed) errs.push(t("addVessel.confirmAnyway"));
    setErrors(errs);
    if (errs.length > 0 || !pv.ok) return;

    const position = { at: pv.value.at, lat: pv.value.lat, lon: pv.value.lon, speedKn: null, courseDeg: null };
    if (target) {
      appendPosition(target.id, { ...position, source: "manual", confidence: "unverified" }, nowDate.toISOString());
      router.back();
    } else if (input) {
      const v = buildManualVessel(newLocalVesselId(), input, position);
      add(v);
      router.replace({ pathname: "/ghe/[id]", params: { id: v.id } });
    }
  };

  return (
    <Screen>
      <BackHeader />
      <Title sub={updating ? target.regNo : undefined}>{updating ? t("addVessel.titleUpdate") : t("addVessel.title")}</Title>

      {!updating && (
        <>
          <Field label={t("addVessel.regNo")} value={regNo} onChange={setRegNo} placeholder={t("addVessel.regNoPlaceholder")} autoCaps="characters" />
          {duplicate && (
            <Pressable onPress={() => router.replace({ pathname: "/ghe/[id]", params: { id: duplicate.id } })} accessibilityRole="link">
              <Note tone="danger">
                {t("addVessel.duplicate")} <Text style={{ textDecorationLine: "underline" }}>{t("addVessel.openExisting")}</Text>
              </Note>
            </Pressable>
          )}
          <Field label={t("addVessel.label")} value={label} onChange={setLabel} placeholder={t("addVessel.labelPlaceholder")} />
        </>
      )}

      <SectionLabel>{t("addVessel.sectionPosition")}</SectionLabel>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label={t("addVessel.lat")} value={lat} onChange={setLat} placeholder="14.90" keyboard="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t("addVessel.lon")} value={lon} onChange={setLon} placeholder="112.60" keyboard="decimal-pad" />
        </View>
      </View>
      <Field label={t("addVessel.at")} value={at} onChange={setAt} placeholder="16:53 17/09/2026" keyboard="numbers-and-punctuation" />
      <Note>{t("addVessel.noSource")}</Note>

      {warnings.map((w) => (
        <Note key={w} tone="danger">
          {w}
        </Note>
      ))}
      {warnings.length > 0 && (
        <View style={styles.confirm}>
          <Switch value={confirmed} onValueChange={setConfirmed} accessibilityLabel={t("addVessel.confirmAnyway")} />
          <Text style={{ color: c.text, fontSize: f.sm, flex: 1 }}>{t("addVessel.confirmAnyway")}</Text>
        </View>
      )}

      {preview && watchlist.primary && (
        <View style={styles.preview}>
          <Text style={{ color: c.muted, fontSize: f.sm }}>{t("addVessel.preview")}</Text>
          <RiskLabel level={preview.level} />
        </View>
      )}

      {errors.map((e) => (
        <Note key={e} tone="danger">
          {e}
        </Note>
      ))}
      <Button label={updating ? t("addVessel.saveUpdate") : t("addVessel.save")} onPress={save} style={{ marginTop: 16 }} disabled={full} />
      {watchlist.primary && <Note>{t("addVessel.nextUpdate")}</Note>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 12 },
  confirm: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  preview: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
});
