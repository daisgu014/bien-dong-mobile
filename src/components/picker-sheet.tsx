import { Check, X } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "@/shared/i18n";
import { GUTTER } from "~/theme/tokens";
import { useTheme } from "~/theme/use-theme";

export interface PickerItem {
  id: string;
  name: string;
  hint?: string;
}

/** Bỏ dấu tiếng Việt để tìm "da nang" ra "Đà Nẵng". */
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

/** Chọn khu vực dạng sheet đáy, có ô tìm không dấu, dấu ✓ mục đang chọn (S-07 "Chọn khu vực"). */
export function PickerSheet({
  visible,
  title,
  searchPlaceholder,
  items,
  selectedId,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  searchPlaceholder: string;
  items: readonly PickerItem[];
  selectedId: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const { c, f } = useTheme();
  const [q, setQ] = useState("");
  const list = q.trim() ? items.filter((i) => fold(i.name).includes(fold(q.trim()))) : items;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={styles.head}>
          <Text style={{ color: c.text, fontSize: f.lg, fontWeight: "700" }}>{title}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t("weather.pick.close")} style={styles.close}>
            <X color={c.muted} size={22} />
          </Pressable>
        </View>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={searchPlaceholder}
          placeholderTextColor={c.muted}
          style={[styles.search, { color: c.text, borderColor: c.border, backgroundColor: c.surface, fontSize: f.md }]}
        />
        <FlatList
          data={list}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 24 }}
          ListEmptyComponent={<Text style={{ color: c.muted, fontSize: f.sm, paddingVertical: 12 }}>{t("weather.pick.empty")}</Text>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onPick(item.id);
                setQ("");
                onClose();
              }}
              style={[styles.item, { borderBottomColor: c.divider }]}
              accessibilityRole="button"
              accessibilityState={{ selected: item.id === selectedId }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: f.md }}>{item.name}</Text>
                {item.hint ? <Text style={{ color: c.muted, fontSize: f.xs }}>{item.hint}</Text> : null}
              </View>
              {item.id === selectedId && <Check color={c.primaryText} size={20} />}
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: GUTTER, paddingTop: 8 },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  search: { minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 12, marginHorizontal: GUTTER, marginVertical: 8 },
  item: { flexDirection: "row", alignItems: "center", minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth },
});
