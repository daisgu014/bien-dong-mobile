// Ngày lịch theo GMT+7 dạng "YYYY-MM-DD" — thuần, không đọc đồng hồ (now truyền vào).
const DAY_MS = 86_400_000;
const GMT7_MS = 7 * 3_600_000;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDate(s: string): boolean {
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Ngày GMT+7 của một mốc UTC. */
export function dateGmt7(now: string | Date): string {
  const ms = (typeof now === "string" ? new Date(now) : now).getTime();
  return new Date(ms + GMT7_MS).toISOString().slice(0, 10);
}

export function addDays(date: string, n: number): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

/** Số ngày từ a tới b (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / DAY_MS);
}

/** Thứ trong tuần (0 = Chủ nhật) của một ngày lịch. */
export function weekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** Giới hạn tra cứu thời tiết đã qua: tối đa 31 ngày mỗi lần, từ 01/01/1940 (ERA5) tới hôm qua. */
export const HISTORY_MAX_DAYS = 31;
export const HISTORY_MIN_DATE = "1940-01-01";

export type HistoryRangeError = "format" | "order" | "future" | "tooOld" | "tooLong";

export function validateHistoryRange(from: string, to: string, today: string): HistoryRangeError | null {
  if (!isIsoDate(from) || !isIsoDate(to)) return "format";
  if (daysBetween(from, to) < 0) return "order";
  if (daysBetween(to, today) < 1) return "future";
  if (daysBetween(HISTORY_MIN_DATE, from) < 0) return "tooOld";
  if (daysBetween(from, to) + 1 > HISTORY_MAX_DAYS) return "tooLong";
  return null;
}
