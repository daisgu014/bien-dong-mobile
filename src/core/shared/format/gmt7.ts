// Mọi giờ hiển thị theo GMT+7 và ghi rõ "GMT+7" (BR-12, A-05). Lưu trữ UTC.
const TZ = "Asia/Ho_Chi_Minh";

const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export interface Gmt7Parts {
  hh: string;
  mm: string;
  dd: string;
  MM: string;
  yyyy: string;
}

/** Tách các thành phần giờ GMT+7 từ một mốc UTC. Không phụ thuộc múi giờ máy chủ. */
export function partsGmt7(iso: string | Date): Gmt7Parts {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const parts = fmt.formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour");
  return { hh: hour === "24" ? "00" : hour, mm: get("minute"), dd: get("day"), MM: get("month"), yyyy: get("year") };
}

/** `HH:mm` */
export function formatTimeGmt7(iso: string | Date): string {
  const p = partsGmt7(iso);
  return `${p.hh}:${p.mm}`;
}

/** `HH:mm dd/MM` */
export function formatTimeDateGmt7(iso: string | Date): string {
  const p = partsGmt7(iso);
  return `${p.hh}:${p.mm} ${p.dd}/${p.MM}`;
}

/** `dd/MM HHh` — dùng cho điểm đường đi bão (§7.1 CMP-05). */
export function formatTrackTimeGmt7(iso: string | Date): string {
  const p = partsGmt7(iso);
  return `${p.dd}/${p.MM} ${p.hh}h`;
}

/** `HH:mm dd/MM/yyyy` (không kèm múi giờ — dùng khi nhãn "GMT+7" đã đứng cạnh). */
export function formatDateTimeGmt7(iso: string | Date): string {
  const p = partsGmt7(iso);
  return `${p.hh}:${p.mm} ${p.dd}/${p.MM}/${p.yyyy}`;
}

/** `HH:mm dd/MM/yyyy GMT+7` — dạng đầy đủ luôn kèm nhãn múi giờ. */
export function formatGmt7(iso: string | Date): string {
  return `${formatDateTimeGmt7(iso)} GMT+7`;
}

/** Số phút giữa hai mốc, làm tròn xuống, không âm. */
export function minutesBetween(fromIso: string, nowIso: string): number {
  const ms = new Date(nowIso).getTime() - new Date(fromIso).getTime();
  return Math.max(0, Math.floor(ms / 60_000));
}

const GMT7_OFFSET_MS = 7 * 3_600_000;

/** ISO UTC → giá trị cho `<input type="datetime-local">` theo giờ GMT+7 ("YYYY-MM-DDTHH:mm"). */
export function toGmt7InputValue(iso: string | Date): string {
  return new Date(new Date(iso).getTime() + GMT7_OFFSET_MS).toISOString().slice(0, 16);
}

/** Giá trị `datetime-local` hiểu là GMT+7 → ISO UTC (lưu trữ UTC, A-05). Sai định dạng → null. */
export function fromGmt7InputValue(value: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number) as [number, number, number, number, number, number];
  return new Date(Date.UTC(y, mo - 1, d, h, mi) - GMT7_OFFSET_MS).toISOString();
}
