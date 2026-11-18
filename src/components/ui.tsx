// Khối giao diện cơ bản. Hướng của chủ sản phẩm: ít chữ, chữ thường, không thẻ bo viền chứa chữ — dùng khoảng trống + đường kẻ mảnh.
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { GUTTER } from "~/theme/tokens";
import { useTheme } from "~/theme/use-theme";

export function Screen({ children, scroll = true, edges = ["top"] }: { children: ReactNode; scroll?: boolean; edges?: Edge[] }) {
  const { c } = useTheme();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: c.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

export function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  const { c, f } = useTheme();
  return (
    <View style={{ paddingTop: 12, paddingBottom: 8 }}>
      <Text style={{ color: c.text, fontSize: f.xxl, fontWeight: "700", letterSpacing: -0.3 }}>{children}</Text>
      {sub ? <Text style={{ color: c.muted, fontSize: f.sm, marginTop: 2 }}>{sub}</Text> : null}
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  const { c, f } = useTheme();
  return <Text style={{ color: c.muted, fontSize: f.xs, fontWeight: "600", marginTop: 24, marginBottom: 6 }}>{children}</Text>;
}

export function Divider() {
  const { c } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.border }} />;
}

/** Một dòng nhãn — giá trị, kẻ mảnh phía dưới. */
export function KeyValue({ label, value, strong = false }: { label: string; value: ReactNode; strong?: boolean }) {
  const { c, f } = useTheme();
  return (
    <View style={[styles.kv, { borderBottomColor: c.divider }]}>
      <Text style={{ color: c.muted, fontSize: f.sm, flexShrink: 0 }}>{label}</Text>
      {typeof value === "string" ? (
        <Text style={{ color: c.text, fontSize: f.sm, fontWeight: strong ? "700" : "500", fontVariant: ["tabular-nums"], textAlign: "right", flexShrink: 1 }}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

export function Button({
  label,
  onPress,
  kind = "primary",
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { c, f } = useTheme();
  const bg = kind === "primary" ? c.primaryButton : "transparent";
  const fg = kind === "primary" ? c.onPrimary : kind === "danger" ? c.accent : c.primaryText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: kind === "primary" ? bg : c.border, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
        style,
      ]}
    >
      <Text style={{ color: fg, fontSize: f.md, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

export function Loading({ label }: { label: string }) {
  const { c, f } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={c.muted} />
      <Text style={{ color: c.muted, fontSize: f.sm, marginTop: 8 }}>{label}</Text>
    </View>
  );
}

export function Note({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "danger" }) {
  const { c, f } = useTheme();
  return <Text style={{ color: tone === "danger" ? c.accent : c.muted, fontSize: f.xs, lineHeight: f.xs * 1.45, marginTop: 8 }}>{children}</Text>;
}

/** Tab chữ gạch chân (thay segmented xanh — ưu tiên UX 08/11). */
export function UnderlineTabs<T extends string>({ value, options, onChange }: { value: T; options: Array<{ id: T; label: string }>; onChange: (v: T) => void }) {
  const { c, f } = useTheme();
  return (
    <View style={[styles.tabs, { borderBottomColor: c.divider }]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable key={o.id} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(o.id)} style={[styles.tab, { borderBottomColor: on ? c.primary : "transparent" }]}>
            <Text style={{ color: on ? c.text : c.muted, fontSize: f.md, fontWeight: on ? "700" : "500" }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  kv: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, minHeight: 44, borderBottomWidth: StyleSheet.hairlineWidth },
  button: { minHeight: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 32 },
  tabs: { flexDirection: "row", gap: 20, borderBottomWidth: StyleSheet.hairlineWidth, marginTop: 8 },
  tab: { minHeight: 44, justifyContent: "center", borderBottomWidth: 2 },
});
