// Định dạng số liệu để hiển thị. Không làm tròn ở tầng domain — chỉ ở đây.

/** `"{km} km"` làm tròn số nguyên; null → dash. */
export function formatKm(km: number | null | undefined, unit = "km", dash = "—"): string {
  if (km == null || !Number.isFinite(km)) return dash;
  return `${Math.round(km)} ${unit}`;
}

export function formatKmValue(km: number | null | undefined, dash = "—"): string {
  if (km == null || !Number.isFinite(km)) return dash;
  return String(Math.round(km));
}

/** Toạ độ `"{lat}°N {lon}°E"` với `digits` chữ số thập phân. */
export function formatCoord(lat: number, lon: number, digits: 1 | 2 = 2, sep = " "): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(digits)}°${ns}${sep}${Math.abs(lon).toFixed(digits)}°${ew}`;
}

/** Tốc độ ghe theo hải lý/giờ. */
export function formatKnots(kn: number | null | undefined, unit = "hl/g", dash = "—"): string {
  if (kn == null || !Number.isFinite(kn)) return dash;
  return `${kn.toFixed(1).replace(/\.0$/, "")} ${unit}`;
}

export function formatDegrees(deg: number | null | undefined, dash = "—"): string {
  if (deg == null || !Number.isFinite(deg)) return dash;
  return `${Math.round(deg)}°`;
}

/** Hướng 16 điểm từ độ, tiếng Việt viết tắt (B, ĐB, Đ, ĐN, N, TN, T, TB). */
export function courseToCompassVn(deg: number | null | undefined): string | null {
  if (deg == null || !Number.isFinite(deg)) return null;
  const names = ["B", "BĐB", "ĐB", "ĐĐB", "Đ", "ĐĐN", "ĐN", "NĐN", "N", "NTN", "TN", "TTN", "T", "TTB", "TB", "BTB"];
  const idx = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16;
  return names[idx] ?? null;
}

/** Thang Beaufort Việt Nam từ m/s (references/units.md). Cận dưới thuộc cấp đó. */
export function toBeaufortVn(ms: number): number {
  const bounds = [0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7, 37.0, 41.5, 46.2, 51.0, 56.1];
  let level = 0;
  for (const b of bounds) {
    if (ms >= b) level += 1;
    else break;
  }
  return level;
}

/** Hướng 16 điểm tiếng Anh (WNW…) từ độ — dùng cho `windDir` của dự báo theo giờ. */
export function degreesToCompassEn(deg: number | null | undefined): string | null {
  if (deg == null || !Number.isFinite(deg)) return null;
  const names = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16;
  return names[idx] ?? null;
}

export const KT_TO_KMH = 1.852;
export const KT_TO_MS = 0.514444;
export const NM_TO_KM = 1.852;
/** Độ cung (vĩ tuyến) → km, R = 6371 km. */
export const DEG_TO_KM = 111.195;
