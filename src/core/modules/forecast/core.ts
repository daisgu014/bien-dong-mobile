// src/modules/forecast/core.ts — public API ĐA NỀN TẢNG (không React/Next/server-only) dùng chung cho web và app mobile (mobile/).
export type { HourlyForecast } from "./domain/types";
export type { CurrentWeather, DailyWeather, DailyWeatherRow, HourWeather, HourWeatherRow, OutlookWeekRow, WeatherOutlook } from "./domain/daily-types";
export { WEATHER_REGIONS, HCM_REGION_ID, findRegion } from "./domain/regions";
export type { WeatherRegion } from "./domain/regions";
export { addDays, dateGmt7, daysBetween, weekday } from "./domain/dates";
export { tideCalendar, springTideWindows, SPRING_TIDE_LAG_DAYS } from "./domain/tide-calendar";
export type { SpringTideWindow, TideCalendar } from "./domain/tide-calendar";
export { weatherKind } from "./domain/weather-code";
export type { WeatherKind } from "./domain/weather-code";
export { SEA_AREAS, findSeaArea } from "./domain/sea-areas";
export type { SeaArea } from "./domain/sea-areas";
export type { SeaDayRow, SeaForecast } from "./domain/sea-types";
// Use-case gọi DS-05 (Open-Meteo) qua sources — đa nền tảng, app mobile gọi trực tiếp.
export { getDailyForecast } from "./application/get-daily";
export type { DailyResult } from "./application/get-daily";
export { getSeaForecast } from "./application/get-sea";
export type { SeaResult } from "./application/get-sea";
