// TanStack Query 5 (cùng thư viện với web). Nhịp làm mới KHÔNG nhanh hơn pollIntervalMinutes của nguồn
// (docs/data-sources.md §3.3): DS-02 JMA 30 phút, DS-05 Open-Meteo 60 phút. Lỗi → giữ dữ liệu lần trước.
import { useQuery } from "@tanstack/react-query";
import { findSeaArea, findRegion, WEATHER_REGIONS, SEA_AREAS } from "@/modules/forecast";
import { getSource } from "@/modules/sources";
import { loadDailyWeather, loadSeaForecast, loadStorms } from "./sources";

const minutes = (n: number) => n * 60_000;
const JMA_MS = minutes(getSource("DS-02").pollIntervalMinutes ?? 30);
const OPEN_METEO_MS = minutes(getSource("DS-05").pollIntervalMinutes ?? 60);

export const queryKeys = {
  storms: ["storms", "active"] as const,
  daily: (id: string) => ["weather", "daily", id] as const,
  sea: (id: string) => ["weather", "sea", id] as const,
};

export function useStorms() {
  return useQuery({ queryKey: queryKeys.storms, queryFn: loadStorms, refetchInterval: JMA_MS, staleTime: JMA_MS, retry: 1 });
}

export function useDailyWeather(regionId: string) {
  const region = findRegion(regionId) ?? WEATHER_REGIONS[0]!;
  return useQuery({ queryKey: queryKeys.daily(region.id), queryFn: () => loadDailyWeather(region), staleTime: OPEN_METEO_MS, retry: 1 });
}

export function useSeaForecast(seaId: string) {
  const area = findSeaArea(seaId) ?? SEA_AREAS[0]!;
  return useQuery({ queryKey: queryKeys.sea(area.id), queryFn: () => loadSeaForecast(area), staleTime: OPEN_METEO_MS, retry: 1 });
}
