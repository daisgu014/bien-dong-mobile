/**
 * Vùng biển thường đánh bắt — mỗi vùng là MỘT điểm đại diện trên biển (không phải trung bình cả vùng).
 * Open-Meteo Marine trả giá trị ô lưới mô hình chứa điểm đó. Toạ độ chọn giữa vùng nước, xa bờ/đảo để mô hình sóng có số liệu.
 */
export interface SeaArea {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export const SEA_AREAS: readonly SeaArea[] = [
  { id: "vinh-bac-bo", name: "Vịnh Bắc Bộ", lat: 19.8, lon: 107.3 },
  { id: "bac-bien-dong", name: "Bắc Biển Đông", lat: 19.0, lon: 115.0 },
  { id: "hoang-sa", name: "Vùng biển Hoàng Sa", lat: 16.5, lon: 112.0 },
  { id: "trung-bo", name: "Ngoài khơi Trung Bộ", lat: 15.5, lon: 110.0 },
  { id: "giua-bien-dong", name: "Giữa Biển Đông", lat: 13.0, lon: 113.0 },
  { id: "nam-trung-bo", name: "Ngoài khơi Nam Trung Bộ", lat: 11.5, lon: 109.8 },
  { id: "truong-sa", name: "Vùng biển Trường Sa", lat: 9.5, lon: 114.0 },
  { id: "nam-bo", name: "Ngoài khơi Nam Bộ", lat: 8.7, lon: 106.8 },
  { id: "vinh-thai-lan", name: "Vịnh Thái Lan", lat: 9.5, lon: 103.3 },
];

export const findSeaArea = (id: string | null | undefined): SeaArea | undefined => SEA_AREAS.find((a) => a.id === id);
