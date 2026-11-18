import type { Storm } from "@/modules/risk";
import type { StormEventDetected } from "@/modules/sources";

/** Port đọc/ghi bão. Bản ghi BẤT BIẾN (A-02): bản tin mới → insert, không update đè. */
export interface StormRepository {
  /** Bản tin mới nhất của mỗi cơn bão chưa tan (DS-01 nhập tay / bản ghi đã lưu). */
  listActive(): Promise<Storm[]>;
  getById(id: string): Promise<Storm | null>;
  /** Thêm bản ghi mới cho một bản tin. Trả về id. */
  insertBulletin(storm: Storm, rawPayloadId: string | null): Promise<string>;
  /** Ghi payload thô để truy vết. KHÔNG trả ra API công khai. */
  storeRawPayload(input: { sourceId: string; sourceUrl: string; fetchedAt: string; contentType: string | null; body: string }): Promise<string>;
  /** Sự kiện phát hiện từ GDACS (bản ghi chờ nguồn chính). Idempotent theo externalId. */
  upsertDetectedEvent(event: StormEventDetected): Promise<void>;
  listDetectedEvents(): Promise<StormEventDetected[]>;
  /** Trạng thái lấy nguồn để hợp nhất (DS-01 lỗi 2 chu kỳ → DS-02). */
  recordSourceOutcome(sourceId: string, outcome: { ok: boolean; at: string; error?: string; issuedAt?: string | null }): Promise<void>;
  getSourceStatus(): Promise<SourceStatusRow[]>;
}

export interface SourceStatusRow {
  sourceId: string;
  lastFetchedAt: string | null;
  lastIssuedAt: string | null;
  lastOkAt: string | null;
  consecutiveFailures: number;
  lastError: string | null;
}

/** Nguồn bão "sống" đọc trực tiếp khi có request (JMA). Lỗi → ok:false, không ném. */
export interface LiveStormSource {
  sourceId: string;
  fetchLive(now: Date): Promise<{ ok: true; storms: Storm[]; fetchedAt: string } | { ok: false; reason: string }>;
}
