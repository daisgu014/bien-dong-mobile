// Lịch KỲ TRIỀU CƯỜNG (nước rong) TP.HCM — do Biển Đông tự tính theo pha Mặt Trăng.
// KHÔNG phải dự báo mực nước: không có số đo, không có cấp báo động (BR-01 — không bịa giá trị).
// Cơ sở: thuỷ triều ở cửa sông Sài Gòn – Đồng Nai lên cao nhất vài ngày sau trăng tròn/trăng mới (quanh rằm, mùng 1 âm lịch).
// TODO(BA-BD-002 §13 Q-08): thay/bổ sung bằng mực nước đỉnh triều chính thức (DS-07) khi có thoả thuận dữ liệu.
import { addDays, dateGmt7, daysBetween } from "./dates";
import { moonPhasesBetween, type MoonPhase } from "./moon-phases";

/** Kỳ triều cường kéo từ ngày có pha trăng tới 3 ngày sau (đỉnh thường rơi vào ngày +1…+2). */
export const SPRING_TIDE_LAG_DAYS = 3;

/** Tháng (dương lịch) thường có triều cường cao nhất ở TP.HCM — tương ứng khoảng tháng 9–12 âm lịch. */
const HIGH_SEASON_MONTHS = new Set([10, 11, 12, 1]);

export interface SpringTideWindow {
  phase: MoonPhase;
  /** Thời điểm pha trăng (ISO UTC). */
  phaseAt: string;
  /** Ngày đầu/cuối của kỳ (GMT+7, gồm cả hai). */
  from: string;
  to: string;
  /** Kỳ rơi vào mùa triều cường cao (tháng 10 – tháng 1). */
  highSeason: boolean;
}

export interface TideCalendar {
  today: string;
  /** Kỳ đang diễn ra (hôm nay nằm trong kỳ), nếu có. */
  current: SpringTideWindow | null;
  /** Các kỳ sắp tới (không gồm kỳ đang diễn ra). */
  upcoming: SpringTideWindow[];
  /** Số ngày tới kỳ kế tiếp (khi chưa ở trong kỳ). */
  daysToNext: number | null;
}

export function springTideWindows(fromDate: string, toDate: string): SpringTideWindow[] {
  // Lùi thêm vài ngày để bắt kỳ đã bắt đầu trước fromDate mà còn kéo dài tới hôm nay.
  const fromMs = new Date(`${addDays(fromDate, -SPRING_TIDE_LAG_DAYS - 1)}T00:00:00+07:00`).getTime();
  const toMs = new Date(`${addDays(toDate, 1)}T00:00:00+07:00`).getTime();
  return moonPhasesBetween(fromMs, toMs)
    .map((e) => {
      const from = dateGmt7(e.at);
      const month = Number(from.slice(5, 7));
      return { phase: e.phase, phaseAt: e.at, from, to: addDays(from, SPRING_TIDE_LAG_DAYS), highSeason: HIGH_SEASON_MONTHS.has(month) };
    })
    .filter((w) => daysBetween(fromDate, w.to) >= 0);
}

/** Lịch cho `horizonDays` ngày kể từ hôm nay (GMT+7). `now` truyền vào (thuần). */
export function tideCalendar(now: string | Date, horizonDays = 60): TideCalendar {
  const today = dateGmt7(now);
  const windows = springTideWindows(today, addDays(today, horizonDays));
  const current = windows.find((w) => daysBetween(w.from, today) >= 0 && daysBetween(today, w.to) >= 0) ?? null;
  const upcoming = windows.filter((w) => w !== current && daysBetween(today, w.from) > 0);
  const next = upcoming[0];
  return { today, current, upcoming, daysToNext: current || !next ? null : daysBetween(today, next.from) };
}
