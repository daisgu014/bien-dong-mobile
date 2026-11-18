import { fetchOpenMeteoDailyForecast, fetchOpenMeteoMarineDaily, type SourcePolicyEnv } from "@/modules/sources";
import type { SeaDayRow, SeaForecast } from "../domain/sea-types";

interface Input {
  lat: number;
  lon: number;
  placeName: string;
  policyEnv: SourcePolicyEnv;
  contactEmail: string;
}

export type SeaResult = { ok: true; data: SeaForecast } | { ok: false; reason: string };

/**
 * Biển 7 ngày tại một điểm (UC-04 mở rộng, tab DỰ BÁO → Trên biển): sóng (Marine API) + gió (Forecast API) theo ngày GMT+7.
 * Sóng là bắt buộc; gió lỗi thì vẫn trả sóng, cột gió để null. Cache 1 giờ — mô hình cập nhật vài lần/ngày.
 */
export async function getSeaForecast(input: Input): Promise<SeaResult> {
  const [marine, wind] = await Promise.all([
    fetchOpenMeteoMarineDaily({ ...input, revalidateSeconds: 3600 }),
    fetchOpenMeteoDailyForecast({ ...input, revalidateSeconds: 3600 }).catch(() => ({ ok: false as const, reason: "source_error" })),
  ]);
  if (!marine.ok) return marine;
  const windByDate = new Map(wind.ok ? wind.data.rows.map((r) => [r.date, r] as const) : []);
  const rows: SeaDayRow[] = marine.data.rows.map((m) => {
    const w = windByDate.get(m.date);
    return {
      ...m,
      weatherCode: w?.weatherCode ?? null,
      windLevel: w?.windLevel ?? null,
      gustLevel: w?.gustLevel ?? null,
      windDir: w?.windDir ?? null,
    };
  });
  return {
    ok: true,
    data: {
      placeName: input.placeName,
      point: marine.data.point,
      rows,
      noWaveData: rows.every((r) => r.waveMaxM === null),
      attribution: marine.data.attribution,
    },
  };
}
