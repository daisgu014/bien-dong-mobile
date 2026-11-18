// Nhãn địa danh biển đảo Việt Nam do app tự đặt (toạ độ tham khảo, 1–2 chữ số thập phân). Không phải dữ liệu của cơ quan khí tượng.
import type { MapView } from "./views";

export interface PlaceLabel {
  id: string;
  name: string;
  lat: number;
  lon: number;
  kind: "archipelago" | "island" | "province";
  /** Khung nhìn được hiển thị. */
  views: readonly MapView[];
}

export const ARCHIPELAGOS: readonly PlaceLabel[] = [
  { id: "hoang-sa", name: "QĐ. Hoàng Sa (Đà Nẵng)", lat: 16.5, lon: 112.0, kind: "archipelago", views: ["sea", "coast", "wide", "globe"] },
  { id: "truong-sa", name: "QĐ. Trường Sa (Khánh Hoà)", lat: 9.9, lon: 114.2, kind: "archipelago", views: ["sea", "coast", "wide", "globe"] },
];

export const ISLANDS: readonly PlaceLabel[] = [
  { id: "co-to", name: "Cô Tô", lat: 21.0, lon: 107.77, kind: "island", views: ["coast"] },
  { id: "cat-ba", name: "Cát Bà", lat: 20.73, lon: 107.05, kind: "island", views: ["coast"] },
  { id: "bach-long-vi", name: "Bạch Long Vĩ", lat: 20.13, lon: 107.72, kind: "island", views: ["sea", "coast"] },
  { id: "con-co", name: "Cồn Cỏ", lat: 17.16, lon: 107.35, kind: "island", views: ["coast"] },
  { id: "cu-lao-cham", name: "Cù Lao Chàm", lat: 15.95, lon: 108.5, kind: "island", views: ["coast"] },
  { id: "ly-son", name: "Lý Sơn", lat: 15.38, lon: 109.12, kind: "island", views: ["sea", "coast"] },
  { id: "phu-quy", name: "Phú Quý", lat: 10.53, lon: 108.94, kind: "island", views: ["sea", "coast"] },
  { id: "con-dao", name: "Côn Đảo", lat: 8.7, lon: 106.6, kind: "island", views: ["sea", "coast"] },
  { id: "phu-quoc", name: "Phú Quốc", lat: 10.22, lon: 103.96, kind: "island", views: ["sea", "coast"] },
  { id: "tho-chu", name: "Thổ Chu", lat: 9.3, lon: 103.47, kind: "island", views: ["coast"] },
  { id: "hon-khoai", name: "Hòn Khoai", lat: 8.43, lon: 104.83, kind: "island", views: ["coast"] },
];

/** Tên vùng biển vẽ chìm dưới các lớp dữ liệu (kiểu hải đồ). Không tham gia chống chồng lấn — ưu tiên nhãn ghe/bão. */
export interface SeaLabel {
  id: string;
  name: string;
  lat: number;
  lon: number;
  size: "lg" | "md";
  views: readonly MapView[];
}

export const SEA_LABELS: readonly SeaLabel[] = [
  { id: "bien-dong", name: "BIỂN ĐÔNG", lat: 12.6, lon: 116.2, size: "lg", views: ["sea", "wide", "globe"] },
  { id: "vinh-bac-bo", name: "Vịnh Bắc Bộ", lat: 19.3, lon: 108.1, size: "md", views: ["sea", "coast", "wide"] },
  { id: "vinh-thai-lan", name: "Vịnh Thái Lan", lat: 9.0, lon: 101.4, size: "md", views: ["coast", "wide"] },
];

/** Mốc lưới kinh–vĩ độ theo khung nhìn (độ). */
export const GRID_STEP: Record<MapView, number> = { globe: 10, wide: 5, sea: 2, coast: 1 };
