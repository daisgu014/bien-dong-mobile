import { geoCircle, geoGraticule, geoPath, type GeoProjection } from "d3-geo";
import { DEG_TO_KM } from "@/shared/format/units";

/** §8.3 #5 — bán kính là km từ nguồn, vẽ bằng geoCircle với radius = km / 111.195. */
export function circlePath(projection: GeoProjection, center: { lat: number; lon: number }, radiusKm: number): string {
  const circle = geoCircle()
    .center([center.lon, center.lat])
    .radius(radiusKm / DEG_TO_KM)
    .precision(1);
  return geoPath(projection)(circle()) ?? "";
}

/** Graticule theo bước `step` độ (§8.3 #2 quy định 5°; app dùng 5°/2°/1° theo khung nhìn cho dễ đọc toạ độ). */
export function graticulePath(projection: GeoProjection, step = 5): string {
  const g = geoGraticule().step([step, step]);
  return geoPath(projection)(g()) ?? "";
}

/** Nhãn kinh/vĩ tuyến ở cạnh dưới/trái theo bbox hiện tại. */
export function graticuleLabels(
  projection: GeoProjection,
  width: number,
  height: number,
  step = 5,
): { lon: Array<{ x: number; text: string }>; lat: Array<{ y: number; text: string }> } {
  const lon: Array<{ x: number; text: string }> = [];
  const lat: Array<{ y: number; text: string }> = [];
  const inv = projection.invert;
  if (!inv) return { lon, lat };
  const bl = inv([0, height]);
  const tr = inv([width, 0]);
  if (!bl || !tr) return { lon, lat };
  const [w, s] = bl;
  const [e, n] = tr;
  for (let l = Math.ceil(w / step) * step; l <= e; l += step) {
    const p = projection([l, s]);
    if (p) lon.push({ x: p[0], text: `${l}°E` });
  }
  for (let l = Math.ceil(s / step) * step; l <= n; l += step) {
    const p = projection([w, l]);
    if (p) lat.push({ y: p[1], text: `${l}°N` });
  }
  return { lon, lat };
}

export function polylinePath(points: Array<[number, number]>): string {
  if (points.length === 0) return "";
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
}
