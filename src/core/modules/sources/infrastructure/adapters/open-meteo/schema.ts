import { z } from "zod";

// Open-Meteo Forecast API + Marine API — xác minh 21/09/2026 (fixture open-meteo-*-20260921.json).
const series = z.array(z.number().nullable());

export const OpenMeteoForecastSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  utc_offset_seconds: z.number(),
  hourly_units: z.object({
    wind_speed_10m: z.string().optional(),
    wind_gusts_10m: z.string().optional(),
    precipitation: z.string().optional(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    wind_speed_10m: series.optional(),
    wind_gusts_10m: series.optional(),
    wind_direction_10m: series.optional(),
    precipitation: series.optional(),
  }),
});

export const OpenMeteoMarineSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  utc_offset_seconds: z.number(),
  hourly: z.object({
    time: z.array(z.string()),
    wave_height: series.optional(),
  }),
});

export type OpenMeteoForecast = z.infer<typeof OpenMeteoForecastSchema>;
export type OpenMeteoMarine = z.infer<typeof OpenMeteoMarineSchema>;

// Dữ liệu theo NGÀY — Forecast API (16 ngày) và Historical Weather API (archive) dùng chung dạng `daily`.
// Chuỗi nào nguồn không trả thì optional; thiếu → null ở bản chuẩn hoá.
export const OpenMeteoDailySchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  utc_offset_seconds: z.number(),
  daily_units: z.object({ wind_speed_10m_max: z.string().optional() }).passthrough().optional(),
  /** Điều kiện hiện tại (chỉ Forecast API, khi gọi kèm `current=`). */
  current: z
    .object({
      time: z.string(),
      temperature_2m: z.number().nullable().optional(),
      weather_code: z.number().nullable().optional(),
      is_day: z.number().nullable().optional(),
    })
    .passthrough()
    .optional(),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: series.optional(),
    temperature_2m_max: series.optional(),
    temperature_2m_min: series.optional(),
    precipitation_sum: series.optional(),
    precipitation_probability_max: series.optional(),
    wind_speed_10m_max: series.optional(),
    wind_gusts_10m_max: series.optional(),
    wind_direction_10m_dominant: series.optional(),
  }),
});

// Seasonal Forecast API (ECMWF EC46/SEAS5): `daily` có thể trả từng thành viên tổ hợp (`<biến>_memberNN`)
// hoặc một chuỗi trung bình — chưa xác minh được payload sống (mạng sandbox chặn 07/11/2026) nên nhận cả hai dạng.
export const OpenMeteoSeasonalSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  utc_offset_seconds: z.number().optional(),
  daily: z.object({ time: z.array(z.string()) }).catchall(z.array(z.number().nullable())),
});

// Theo GIỜ trong một/vài ngày (Forecast API và archive) — chi tiết một ngày ở tab DỰ BÁO.
export const OpenMeteoHourlyDaySchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  utc_offset_seconds: z.number(),
  hourly_units: z.object({ wind_speed_10m: z.string().optional() }).passthrough().optional(),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: series.optional(),
    apparent_temperature: series.optional(),
    weather_code: series.optional(),
    is_day: series.optional(),
    precipitation: series.optional(),
    precipitation_probability: series.optional(),
    relative_humidity_2m: series.optional(),
    wind_speed_10m: series.optional(),
    wind_gusts_10m: series.optional(),
    wind_direction_10m: series.optional(),
  }),
});

export type OpenMeteoHourlyDay = z.infer<typeof OpenMeteoHourlyDaySchema>;
export type OpenMeteoDaily = z.infer<typeof OpenMeteoDailySchema>;
export type OpenMeteoSeasonal = z.infer<typeof OpenMeteoSeasonalSchema>;

// Marine API theo NGÀY — sóng tại một điểm biển (tab DỰ BÁO → Trên biển). Điểm trên đất liền: nguồn trả null.
export const OpenMeteoMarineDailySchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  utc_offset_seconds: z.number(),
  daily_units: z.object({ wave_height_max: z.string().optional() }).passthrough().optional(),
  daily: z.object({
    time: z.array(z.string()),
    wave_height_max: series.optional(),
    wave_direction_dominant: series.optional(),
    wave_period_max: series.optional(),
    swell_wave_height_max: series.optional(),
  }),
});

export type OpenMeteoMarineDaily = z.infer<typeof OpenMeteoMarineDailySchema>;
