/** Nhóm thời tiết từ mã WMO 4677 (Open-Meteo `weather_code`) — chỉ đổi tên nhóm, không suy diễn thêm. */
export type WeatherKind = "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "heavyRain" | "showers" | "thunder" | "unknown";

export function weatherKind(code: number | null): WeatherKind {
  if (code === null) return "unknown";
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code === 61 || code === 63 || code === 66) return "rain";
  if (code === 65 || code === 67) return "heavyRain";
  if (code >= 80 && code <= 82) return "showers";
  if (code >= 95 && code <= 99) return "thunder";
  return "unknown";
}
