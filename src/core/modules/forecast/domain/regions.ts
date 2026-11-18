/**
 * 34 tỉnh/thành (sắp xếp 01/07/2025) — điểm lấy thời tiết là trung tâm hành chính của đơn vị, làm tròn 0,01°.
 * "Khu vực" ở tab DỰ BÁO = một điểm; Open-Meteo trả giá trị ô lưới mô hình chứa điểm đó (không phải trung bình cả tỉnh).
 */
export interface WeatherRegion {
  id: string;
  name: string;
  /** Nơi đặt điểm lấy dữ liệu (trung tâm hành chính). */
  center: string;
  lat: number;
  lon: number;
  /** Có thông tin triều cường TP.HCM. */
  hcmTide?: true;
}

export const HCM_REGION_ID = "hcm";

export const WEATHER_REGIONS: readonly WeatherRegion[] = [
  { id: "hcm", name: "TP. Hồ Chí Minh", center: "Quận 1 cũ", lat: 10.78, lon: 106.7, hcmTide: true },
  { id: "ha-noi", name: "Hà Nội", center: "Hoàn Kiếm", lat: 21.03, lon: 105.85 },
  { id: "hai-phong", name: "Hải Phòng", center: "Hải Phòng", lat: 20.86, lon: 106.68 },
  { id: "hue", name: "Huế", center: "Huế", lat: 16.46, lon: 107.59 },
  { id: "da-nang", name: "Đà Nẵng", center: "Hải Châu", lat: 16.05, lon: 108.22 },
  { id: "can-tho", name: "Cần Thơ", center: "Ninh Kiều", lat: 10.03, lon: 105.78 },
  { id: "quang-ninh", name: "Quảng Ninh", center: "Hạ Long", lat: 20.95, lon: 107.08 },
  { id: "thanh-hoa", name: "Thanh Hoá", center: "Thanh Hoá", lat: 19.81, lon: 105.78 },
  { id: "nghe-an", name: "Nghệ An", center: "Vinh", lat: 18.68, lon: 105.68 },
  { id: "ha-tinh", name: "Hà Tĩnh", center: "Hà Tĩnh", lat: 18.34, lon: 105.91 },
  { id: "quang-tri", name: "Quảng Trị", center: "Đồng Hới", lat: 17.47, lon: 106.62 },
  { id: "quang-ngai", name: "Quảng Ngãi", center: "Quảng Ngãi", lat: 15.12, lon: 108.8 },
  { id: "gia-lai", name: "Gia Lai", center: "Quy Nhơn", lat: 13.78, lon: 109.22 },
  { id: "dak-lak", name: "Đắk Lắk", center: "Buôn Ma Thuột", lat: 12.67, lon: 108.04 },
  { id: "khanh-hoa", name: "Khánh Hoà", center: "Nha Trang", lat: 12.24, lon: 109.19 },
  { id: "lam-dong", name: "Lâm Đồng", center: "Đà Lạt", lat: 11.94, lon: 108.44 },
  { id: "dong-nai", name: "Đồng Nai", center: "Biên Hoà", lat: 10.95, lon: 106.82 },
  { id: "tay-ninh", name: "Tây Ninh", center: "Tân An", lat: 10.54, lon: 106.41 },
  { id: "dong-thap", name: "Đồng Tháp", center: "Mỹ Tho", lat: 10.36, lon: 106.36 },
  { id: "vinh-long", name: "Vĩnh Long", center: "Vĩnh Long", lat: 10.25, lon: 105.97 },
  { id: "an-giang", name: "An Giang", center: "Rạch Giá", lat: 10.01, lon: 105.08 },
  { id: "ca-mau", name: "Cà Mau", center: "Cà Mau", lat: 9.18, lon: 105.15 },
  { id: "hung-yen", name: "Hưng Yên", center: "Hưng Yên", lat: 20.65, lon: 106.05 },
  { id: "ninh-binh", name: "Ninh Bình", center: "Hoa Lư", lat: 20.25, lon: 105.97 },
  { id: "bac-ninh", name: "Bắc Ninh", center: "Bắc Giang", lat: 21.27, lon: 106.19 },
  { id: "phu-tho", name: "Phú Thọ", center: "Việt Trì", lat: 21.32, lon: 105.4 },
  { id: "thai-nguyen", name: "Thái Nguyên", center: "Thái Nguyên", lat: 21.59, lon: 105.85 },
  { id: "tuyen-quang", name: "Tuyên Quang", center: "Tuyên Quang", lat: 21.82, lon: 105.21 },
  { id: "lao-cai", name: "Lào Cai", center: "Yên Bái", lat: 21.72, lon: 104.91 },
  { id: "lang-son", name: "Lạng Sơn", center: "Lạng Sơn", lat: 21.85, lon: 106.76 },
  { id: "cao-bang", name: "Cao Bằng", center: "Cao Bằng", lat: 22.67, lon: 106.26 },
  { id: "son-la", name: "Sơn La", center: "Sơn La", lat: 21.33, lon: 103.91 },
  { id: "dien-bien", name: "Điện Biên", center: "Điện Biên Phủ", lat: 21.39, lon: 103.02 },
  { id: "lai-chau", name: "Lai Châu", center: "Lai Châu", lat: 22.4, lon: 103.46 },
];

export function findRegion(id: string | null | undefined): WeatherRegion | null {
  return WEATHER_REGIONS.find((r) => r.id === id) ?? null;
}
