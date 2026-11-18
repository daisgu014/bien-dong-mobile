import { evaluateSource, type SourcePolicyEnv } from "../domain/policy";
import type { NormalizedStormSnapshot } from "../domain/storm-snapshot";
import { fetchFromSource, getCached } from "../infrastructure/http-client";
import {
  jmaForecastUrl,
  jmaSpecificationsUrl,
  jmaTargetUrl,
  normalizeJmaStorm,
  parseJmaForecast,
  parseJmaSpecifications,
  parseJmaTargetTc,
} from "../infrastructure/adapters/jma/adapter";
import { getSource } from "../registry";

export interface FetchJmaInput {
  policyEnv: SourcePolicyEnv;
  contactEmail: string;
  now: Date;
  /** Đang dùng JMA thay cho DS-01 (không có bản tin NCHMF) → gắn `isFallback`. */
  isFallback: boolean;
  /** TTL Data Cache của Next (giây). Mặc định 15 phút. 0 → dùng cache trong bộ nhớ + ETag. */
  revalidateSeconds?: number;
}

export type FetchJmaResult =
  | { ok: true; storms: NormalizedStormSnapshot[]; fetchedAt: string; skipped: string[] }
  | { ok: false; reason: string };

/**
 * Use-case DS-02: mọi xoáy thuận JMA đang phát bản tin (bão + áp thấp nhiệt đới), đã chuẩn hoá.
 * Nguồn không được phép dùng → ok:false. Một xoáy thuận lỗi schema → bỏ qua và ghi vào `skipped`, không chặn phần còn lại (UC-13 2a).
 */
export async function fetchJmaStorms(input: FetchJmaInput): Promise<FetchJmaResult> {
  const def = getSource("DS-02");
  const verdict = evaluateSource(def, input.policyEnv);
  if (!verdict.usable) return { ok: false, reason: verdict.reason };

  const opts = { contactEmail: input.contactEmail, backoffMs: [] as number[], revalidateSeconds: input.revalidateSeconds ?? 900 };
  const read = async (url: string) => {
    const res = await fetchFromSource(def, url, opts);
    const body = res.body ?? getCached(def, url)?.body ?? null;
    return body === null ? null : { json: JSON.parse(body) as unknown, fetchedAt: res.fetchedAt };
  };

  const target = await read(jmaTargetUrl());
  if (!target) return { ok: false, reason: "không có dữ liệu targetTc" };
  const list = parseJmaTargetTc(target.json);

  const storms: NormalizedStormSnapshot[] = [];
  const skipped: string[] = [];
  for (const tc of list) {
    try {
      const spec = await read(jmaSpecificationsUrl(tc.tropicalCyclone));
      if (!spec) {
        skipped.push(`${tc.tropicalCyclone}: không có specifications`);
        continue;
      }
      let forecast = null;
      try {
        const fc = await read(jmaForecastUrl(tc.tropicalCyclone));
        forecast = fc ? parseJmaForecast(fc.json) : null;
      } catch (err) {
        console.warn("[sources] JMA forecast.json lỗi, bỏ vệt quá khứ:", err instanceof Error ? err.message : err);
      }
      const s = normalizeJmaStorm(def, tc, parseJmaSpecifications(spec.json), forecast, { fetchedAt: spec.fetchedAt, isFallback: input.isFallback });
      if (s) storms.push(s);
      else skipped.push(`${tc.tropicalCyclone}: thiếu bản tin thực tế`);
    } catch (err) {
      skipped.push(`${tc.tropicalCyclone}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return { ok: true, storms, fetchedAt: target.fetchedAt, skipped };
}
