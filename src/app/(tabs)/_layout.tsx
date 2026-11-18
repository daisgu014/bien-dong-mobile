import { Tabs } from "expo-router";
import { CloudRain, Map, Settings, Ship } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { t } from "@/shared/i18n";
import { useTheme } from "~/theme/use-theme";

/** M-06: Bản đồ · Ghe · Dự báo · Cài đặt — mục cao ≥ 44 px, tab đang chọn màu primary. */
export default function TabsLayout() {
  const { c, f } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primaryText,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.divider, height: 62 + insets.bottom },
        tabBarItemStyle: { paddingVertical: 4 },
        tabBarLabelStyle: { fontSize: f.xs - 1, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.map"), tabBarIcon: ({ color, size }) => <Map color={color} size={size - 2} /> }} />
      <Tabs.Screen name="ghe" options={{ title: t("tabs.vessels"), tabBarIcon: ({ color, size }) => <Ship color={color} size={size - 2} /> }} />
      <Tabs.Screen name="du-bao" options={{ title: t("tabs.forecast"), tabBarIcon: ({ color, size }) => <CloudRain color={color} size={size - 2} /> }} />
      <Tabs.Screen name="cai-dat" options={{ title: t("tabs.settings"), tabBarIcon: ({ color, size }) => <Settings color={color} size={size - 2} /> }} />
    </Tabs>
  );
}
