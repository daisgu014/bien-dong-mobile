import type { Attribution } from "@/modules/risk";

/** Một ngày trên biển (lịch GMT+7). Sóng từ Marine API, gió từ Forecast API (cấp Beaufort đã chuyển đổi). Thiếu → null (BR-01). */
export interface SeaDayRow {
  date: string;
  waveMaxM: number | null;
  swellMaxM: number | null;
  wavePeriodS: number | null;
  waveDir: string | null;
  weatherCode: number | null;
  windLevel: number | null;
  gustLevel: number | null;
  windDir: string | null;
}

/** DTO biển 7 ngày tại một điểm. Hai lần gọi cùng nguồn DS-05 → một attribution (của Marine API, nguồn chính của khối này). */
export interface SeaForecast {
  placeName: string;
  point: { lat: number; lon: number };
  rows: SeaDayRow[];
  /** true khi nguồn không có số liệu sóng cho điểm (thường do điểm nằm trên đất liền hoặc sát bờ). */
  noWaveData: boolean;
  attribution: Attribution;
}
