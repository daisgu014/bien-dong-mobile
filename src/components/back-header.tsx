import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, Text } from "react-native";
import { t } from "@/shared/i18n";
import { useTheme } from "~/theme/use-theme";

export function BackHeader({ label = t("addVessel.back") }: { label?: string }) {
  const { c, f } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      style={{ flexDirection: "row", alignItems: "center", minHeight: 44, marginLeft: -6 }}
    >
      <ChevronLeft color={c.primaryText} size={22} />
      <Text style={{ color: c.primaryText, fontSize: f.md }}>{label}</Text>
    </Pressable>
  );
}
