import type { Attribution, HourlyForecastRow } from "@/modules/risk";

/** DTO dự báo theo giờ tại một điểm (UC-04). Luôn kèm attribution (CLAUDE.md quy tắc 1). */
export interface HourlyForecast {
  point: { lat: number; lon: number };
  placeName: string;
  rows: HourlyForecastRow[]; // 8 mốc 3 giờ
  attribution: Attribution;
}
