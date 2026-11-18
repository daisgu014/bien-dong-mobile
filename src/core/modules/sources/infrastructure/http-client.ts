// Client HTTP dùng chung cho MỌI request ra nguồn ngoài (.claude/rules/data-sources.md).
// User-Agent nêu tên app + email; timeout 10 s; retry lùi luỹ tiến; ETag/If-Modified-Since; không gọi nhanh hơn pollIntervalMinutes.
import type { SourceDefinition } from "../domain/registry-schema";

export interface SourceFetchOptions {
  contactEmail: string;
  timeoutMs?: number;
  /** Lịch retry (ms). Mặc định UC-13: 30 s / 2 ph / 5 ph. Trong serverless nên để [] và dựa vào lần cron kế. */
  backoffMs?: readonly number[];
  /** Bỏ qua giới hạn tần suất (ví dụ khi người dùng bấm "tải lại" có kiểm soát). */
  force?: boolean;
  /**
   * Dùng Data Cache của Next (chia sẻ giữa các lần gọi serverless) với TTL này, gắn tag "storm".
   * Khi đặt, bỏ giới hạn tần suất/ETag trong bộ nhớ vì Next đã khử trùng lặp. Không dùng trong test.
   */
  revalidateSeconds?: number;
  signal?: AbortSignal;
  now?: () => number;
}

export interface SourceFetchResult {
  status: number;
  /** null khi 304 Not Modified (dùng bản cache) hoặc khi bị chặn bởi giới hạn tần suất. */
  body: string | null;
  notModified: boolean;
  rateLimited: boolean;
  etag: string | null;
  lastModified: string | null;
  fetchedAt: string;
  url: string;
}

interface CacheEntry {
  etag: string | null;
  lastModified: string | null;
  body: string;
  fetchedAtMs: number;
}

// Cache theo (sourceId, url) — sống trong một instance (đủ cho cron/serverless ấm).
const cache = new Map<string, CacheEntry>();

export class SourceHttpError extends Error {
  constructor(
    public readonly sourceId: string,
    public readonly url: string,
    public readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = "SourceHttpError";
  }
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("aborted"));
    });
  });

function userAgent(def: SourceDefinition, email: string): string {
  return def.userAgent.replace("{email}", email);
}

/**
 * Lấy dữ liệu từ nguồn đã đăng ký. Không kiểm policy ở đây — caller phải gọi `isSourceUsable` trước.
 * Trả `body: null` khi 304 (caller dùng `getCached`) hoặc khi gọi sớm hơn `pollIntervalMinutes`.
 */
export async function fetchFromSource(def: SourceDefinition, url: string, opts: SourceFetchOptions): Promise<SourceFetchResult> {
  const now = opts.now ?? (() => Date.now());
  const key = `${def.id}|${url}`;
  const cached = cache.get(key);

  if (!opts.force && !opts.revalidateSeconds && cached && def.pollIntervalMinutes) {
    const minGapMs = def.pollIntervalMinutes * 60_000;
    if (now() - cached.fetchedAtMs < minGapMs) {
      return {
        status: 0,
        body: null,
        notModified: false,
        rateLimited: true,
        etag: cached.etag,
        lastModified: cached.lastModified,
        fetchedAt: new Date(cached.fetchedAtMs).toISOString(),
        url,
      };
    }
  }

  const headers: Record<string, string> = {
    "user-agent": userAgent(def, opts.contactEmail),
    accept: "application/json, application/geo+json, text/plain;q=0.8, */*;q=0.5",
  };
  if (cached?.etag) headers["if-none-match"] = cached.etag;
  if (cached?.lastModified) headers["if-modified-since"] = cached.lastModified;

  const backoff = opts.backoffMs ?? [30_000, 120_000, 300_000];
  let attempt = 0;
  let lastErr: unknown = null;

  while (attempt <= backoff.length) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), opts.timeoutMs ?? 10_000);
    opts.signal?.addEventListener("abort", () => ac.abort());
    try {
      const res = await fetch(
        url,
        opts.revalidateSeconds
          ? { headers: { "user-agent": headers["user-agent"] ?? "", accept: headers.accept ?? "" }, signal: ac.signal, next: { revalidate: opts.revalidateSeconds, tags: ["storm", def.id] } }
          : { headers, signal: ac.signal, cache: "no-store" },
      );
      clearTimeout(timer);
      const fetchedAtMs = now();
      const fetchedAt = new Date(fetchedAtMs).toISOString();

      if (res.status === 304 && cached) {
        cache.set(key, { ...cached, fetchedAtMs });
        return { status: 304, body: null, notModified: true, rateLimited: false, etag: cached.etag, lastModified: cached.lastModified, fetchedAt, url };
      }
      if (res.status >= 500 || res.status === 429) {
        lastErr = new SourceHttpError(def.id, url, res.status, `HTTP ${res.status}`);
      } else if (!res.ok) {
        throw new SourceHttpError(def.id, url, res.status, `HTTP ${res.status}`);
      } else {
        const body = await res.text();
        const etag = res.headers.get("etag");
        const lastModified = res.headers.get("last-modified");
        cache.set(key, { etag, lastModified, body, fetchedAtMs });
        return { status: res.status, body, notModified: false, rateLimited: false, etag, lastModified, fetchedAt, url };
      }
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof SourceHttpError && err.status !== null && err.status < 500 && err.status !== 429) throw err;
      lastErr = err;
    }
    const wait = backoff[attempt];
    attempt += 1;
    if (wait === undefined) break;
    await sleep(wait, opts.signal);
  }

  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new SourceHttpError(def.id, url, lastErr instanceof SourceHttpError ? lastErr.status : null, `Không lấy được ${def.id}: ${msg}`);
}

/** Bản cache gần nhất (dùng sau khi nhận 304 hoặc bị giới hạn tần suất). */
export function getCached(def: SourceDefinition, url: string): { body: string; fetchedAt: string } | null {
  const c = cache.get(`${def.id}|${url}`);
  return c ? { body: c.body, fetchedAt: new Date(c.fetchedAtMs).toISOString() } : null;
}

/** Dành cho test. */
export function clearSourceHttpCache(): void {
  cache.clear();
}
