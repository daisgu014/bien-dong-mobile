import { geoMercator, type GeoProjection } from "d3-geo";

/** Khung nhìn phẳng (Mercator, §8.2). */
export type FlatMapView = "sea" | "coast" | "wide";
/** "globe" = quả địa cầu (orthographic), kéo để xoay — khung nhìn phụ, không thay mặc định. */
export type MapView = FlatMapView | "globe";
export type MapTheme = "light" | "ink";
export type MapLayer = "radius" | "cone" | "track" | "vessels" | "trails" | "grid" | "labels";

export const ALL_LAYERS: readonly MapLayer[] = ["radius", "cone", "track", "vessels", "trails", "grid", "labels"];

/** Lớp mặc định: desktop bật tất cả trừ cone (không có dữ liệu phễu); mobile theo BR-05/GAP-08. */
export const DEFAULT_LAYERS_DESKTOP: readonly MapLayer[] = ["radius", "cone", "track", "vessels", "trails", "grid", "labels"];
export const DEFAULT_LAYERS_MOBILE: readonly MapLayer[] = ["radius", "track", "vessels", "labels"];

/** §8.2 — bbox [lon, lat] góc Tây Nam → Đông Bắc. */
export const VIEW_BBOX: Record<FlatMapView, [[number, number], [number, number]]> = {
  sea: [
    [104.5, 6.0],
    [123.5, 22.5],
  ],
  // Bản 1.1: mở rộng để thấy trọn bờ biển từ Móng Cái tới Cà Mau, Phú Quốc, Thổ Chu (bản 1.0: [106,10.5]→[117,20] cắt mất Nam Bộ).
  coast: [
    [102.5, 7.5],
    [113.5, 21.8],
  ],
  wide: [
    [100.0, 1.0],
    [128.0, 25.0],
  ],
};

/** Mercator fit theo bbox của khung nhìn, chừa lề `padding` px. */
export function makeProjection(view: FlatMapView, width: number, height: number, padding = 8): GeoProjection {
  const [[w, s], [e, n]] = VIEW_BBOX[view];
  // d3-geo: vành ngoài phải theo chiều KIM ĐỒNG HỒ trên mặt cầu, nếu không sẽ fit phần bù (cả thế giới).
  const bboxPolygon: GeoJSON.Polygon = {
    type: "Polygon",
    coordinates: [
      [
        [w, s],
        [w, n],
        [e, n],
        [e, s],
        [w, s],
      ],
    ],
  };
  return geoMercator()
    .fitExtent(
      [
        [padding, padding],
        [Math.max(padding + 1, width - padding), Math.max(padding + 1, height - padding)],
      ],
      bboxPolygon,
    )
    .clipExtent([
      [0, 0],
      [width, height],
    ]);
}

/** Chiều dài (px) của `km` tại vĩ độ `lat` trên phép chiếu — dùng cho thước tỉ lệ 200 km. */
export function kmToPx(projection: GeoProjection, lat: number, lon: number, km: number): number {
  const dLon = km / (111.195 * Math.cos((lat * Math.PI) / 180));
  const a = projection([lon, lat]);
  const b = projection([lon + dLon, lat]);
  if (!a || !b) return 0;
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}
