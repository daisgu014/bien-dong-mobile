// Nền địa lý DS-06 (Natural Earth, đã cắt theo Biển Đông — scripts/build-basemap.mjs, build-vn-admin.mjs của web).
// Đóng gói vào app để bản đồ vẽ ngay cả khi ngoại tuyến. Lãnh thổ Việt Nam gồm QĐ. Hoàng Sa, Trường Sa (vn-admin.json).
// Cập nhật: chạy lại script của web rồi chép public/basemap/{land-50m-sea,countries-50m-sea,vn-admin}.json vào mobile/assets/basemap/.
import countries from "../../assets/basemap/countries-50m-sea.json";
import land from "../../assets/basemap/land-50m-sea.json";
import admin from "../../assets/basemap/vn-admin.json";

export const BASEMAP = {
  land: land as unknown as GeoJSON.Feature<GeoJSON.MultiPolygon>,
  countries: countries as unknown as { borders: GeoJSON.MultiLineString; vietnam: GeoJSON.MultiPolygon },
  admin: admin as unknown as { archipelagos: GeoJSON.MultiPolygon; borders: GeoJSON.MultiLineString; labels: Array<{ name: string; lat: number; lon: number }> },
};
