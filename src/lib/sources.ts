// Gọi THẲNG nguồn đã đăng ký từ điện thoại (Dao chọn 18/11/2026) bằng chính use-case + adapter zod của web
// (src/modules/{sources,storm,forecast}/core.ts) — không chép logic chuẩn hoá. Chính sách nguồn vẫn áp dụng:
// chỉ nguồn `approved*` (evaluateSource), User-Agent có liên hệ, timeout 10 s, nhịp gọi theo pollIntervalMinutes (qua lịch làm mới ở queries.ts).
import { getDailyForecast, getSeaForecast, type DailyWeather, type SeaForecast, type WeatherRegion, type SeaArea } from "@/modules/forecast";
import type { Storm } from "@/modules/risk";
import { fetchJmaStorms, type SourcePolicyEnv } from "@/modules/sources";
import { getActiveStorms, type StormRepository, type StormWithMeta } from "@/modules/storm";

/** App phi thương mại (Q-L2): DS-05 Open-Meteo chỉ miễn phí cho phi thương mại. */
const POLICY: SourcePolicyEnv = { commercialMode: false, hasPaidKey: () => false, disabledIds: new Set() };

/** Liên hệ trong User-Agent gửi nguồn (docs/data-sources.md §3.3) — cùng mặc định với web (SOURCE_CONTACT_EMAIL). */
const CONTACT_EMAIL = process.env.EXPO_PUBLIC_SOURCE_CONTACT_EMAIL || "dainh.dev@gmail.com";

export class SourceUnavailableError extends Error {}

/** Điện thoại không có kho DS-01 (NCHMF nhập tay ở máy chủ) → kho rỗng; mọi hệ thống lấy từ JMA đều là nguồn dự phòng. */
const EMPTY_REPO: StormRepository = {
  listActive: async () => [],
  getById: async () => null,
  insertBulletin: async () => {
    throw new Error("read-only");
  },
  storeRawPayload: async () => {
    throw new Error("read-only");
  },
  upsertDetectedEvent: async () => {},
  listDetectedEvents: async () => [],
  recordSourceOutcome: async () => {},
  getSourceStatus: async () => [],
};

export interface StormsResult {
  now: string;
  /** Hệ thống đang trong Biển Đông hoặc dự báo đi vào (giống /api/v1/storms/active). */
  data: StormWithMeta[];
}

/**
 * UC-01/UC-03 qua DS-02 JMA. Lỗi nguồn → NÉM lỗi (không trả danh sách rỗng): rỗng nghĩa là "Biển Đông không có bão",
 * nói vậy khi chưa lấy được dữ liệu là sai và nguy hiểm. TanStack Query giữ dữ liệu lần trước + báo ngoại tuyến.
 */
export async function loadStorms(): Promise<StormsResult> {
  const now = new Date();
  let failure: string | null = null;
  const all = await getActiveStorms(EMPTY_REPO, now.toISOString(), {
    sourceId: "DS-02",
    async fetchLive(at) {
      // Để mặc định revalidateSeconds: trên React Native tuỳ chọn `next` của fetch bị bỏ qua, và http-client không đặt
      // `cache: "no-store"` (whatwg-fetch của RN sẽ gắn `?_=<giờ>` vào URL, phá cache CDN của JMA). Nhịp gọi do queries.ts giữ.
      const r = await fetchJmaStorms({ now: at, isFallback: true, contactEmail: CONTACT_EMAIL, policyEnv: POLICY }).catch(
        (err: unknown) => ({ ok: false as const, reason: err instanceof Error ? err.message : String(err) }),
      );
      if (!r.ok) {
        failure = r.reason;
        return r;
      }
      return { ok: true, storms: r.storms as Storm[], fetchedAt: r.fetchedAt };
    },
  });
  if (failure) throw new SourceUnavailableError(failure);
  return { now: now.toISOString(), data: all.filter((s) => s.inSea || s.entersSeaAt !== null) };
}

export async function loadDailyWeather(region: WeatherRegion): Promise<DailyWeather> {
  const r = await getDailyForecast({ lat: region.lat, lon: region.lon, placeName: region.name, now: new Date(), policyEnv: POLICY, contactEmail: CONTACT_EMAIL });
  if (!r.ok) throw new SourceUnavailableError(r.reason);
  return r.data;
}

export async function loadSeaForecast(area: Pick<SeaArea, "lat" | "lon" | "name">): Promise<SeaForecast> {
  const r = await getSeaForecast({ lat: area.lat, lon: area.lon, placeName: area.name, policyEnv: POLICY, contactEmail: CONTACT_EMAIL });
  if (!r.ok) throw new SourceUnavailableError(r.reason);
  return r.data;
}
