// Tuỳ chọn trên thiết bị (S-08): nền, chữ lớn, ngưỡng THEO DÕI BR-21, khung nhìn bản đồ. Lưu AsyncStorage.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FlatMapView } from "@/modules/map";
import type { ThemeName } from "~/theme/tokens";

export const THRESHOLD_OPTIONS = [null, 300, 500, 800] as const;
export type ThresholdKm = (typeof THRESHOLD_OPTIONS)[number];

interface SettingsState {
  theme: ThemeName;
  largeText: boolean;
  /** BR-21: chỉ MỞ RỘNG mức THEO DÕI cho ghe chưa có ngưỡng riêng; null = tắt. */
  thresholdKm: ThresholdKm;
  mapView: FlatMapView;
  setTheme: (t: ThemeName) => void;
  setLargeText: (v: boolean) => void;
  setThresholdKm: (v: ThresholdKm) => void;
  setMapView: (v: FlatMapView) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "ink",
      largeText: false,
      thresholdKm: null,
      mapView: "sea",
      setTheme: (theme) => set({ theme }),
      setLargeText: (largeText) => set({ largeText }),
      setThresholdKm: (thresholdKm) => set({ thresholdKm }),
      setMapView: (mapView) => set({ mapView }),
    }),
    { name: "bien-dong.settings.v1", storage: createJSONStorage(() => AsyncStorage), version: 1 },
  ),
);
