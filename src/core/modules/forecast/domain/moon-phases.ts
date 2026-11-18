// Pha Mặt Trăng (trăng mới / trăng tròn) — Jean Meeus, "Astronomical Algorithms" (2nd ed.), chương 49.
// Bỏ 14 hiệu chỉnh hành tinh (≤ 0,0004 ngày) → sai số cỡ 1 phút, thừa đủ cho lịch theo NGÀY. Thuần, không đọc đồng hồ.

export type MoonPhase = "new" | "full";

const RAD = Math.PI / 180;
const JD_UNIX_EPOCH = 2440587.5;
/** ΔT ≈ TT − UTC (~69 s quanh 2020–2030). */
const DELTA_T_MS = 69_000;

function phaseJde(k: number, phase: MoonPhase): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;

  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = (2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3) * RAD;
  const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4) * RAD;
  const F = (160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4) * RAD;
  const Om = (124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3) * RAD;
  const s = Math.sin;

  const c =
    phase === "new"
      ? [-0.4072, 0.17241, 0.01608, 0.01039, 0.00739, -0.00514, 0.00208]
      : [-0.40614, 0.17302, 0.01614, 0.01043, 0.00734, -0.00515, 0.00209];
  jde +=
    c[0]! * s(Mp) +
    c[1]! * E * s(M) +
    c[2]! * s(2 * Mp) +
    c[3]! * s(2 * F) +
    c[4]! * E * s(Mp - M) +
    c[5]! * E * s(Mp + M) +
    c[6]! * E * E * s(2 * M) -
    0.00111 * s(Mp - 2 * F) -
    0.00057 * s(Mp + 2 * F) +
    0.00056 * E * s(2 * Mp + M) -
    0.00042 * s(3 * Mp) +
    0.00042 * E * s(M + 2 * F) +
    0.00038 * E * s(M - 2 * F) -
    0.00024 * E * s(2 * Mp - M) -
    0.00017 * s(Om) -
    0.00007 * s(Mp + 2 * M) +
    0.00004 * s(2 * Mp - 2 * F) +
    0.00004 * s(3 * M) +
    0.00003 * s(Mp + M - 2 * F) +
    0.00003 * s(2 * Mp + 2 * F) -
    0.00003 * s(Mp + M + 2 * F) +
    0.00003 * s(Mp - M + 2 * F) -
    0.00002 * s(Mp - M - 2 * F) -
    0.00002 * s(3 * Mp + M) +
    0.00002 * s(4 * Mp);
  return jde;
}

function jdeToMs(jde: number): number {
  return (jde - JD_UNIX_EPOCH) * 86_400_000 - DELTA_T_MS;
}

export interface MoonPhaseEvent {
  phase: MoonPhase;
  /** ISO UTC. */
  at: string;
}

/** Các lần trăng mới/trăng tròn trong [fromMs, toMs), tăng dần theo thời gian. */
export function moonPhasesBetween(fromMs: number, toMs: number): MoonPhaseEvent[] {
  const yearsFrom2000 = (fromMs - Date.UTC(2000, 0, 6)) / (365.25 * 86_400_000);
  let k = Math.floor(yearsFrom2000 * 12.3685) - 1;
  const out: MoonPhaseEvent[] = [];
  for (let guard = 0; guard < 2000; guard += 1, k += 1) {
    for (const phase of ["new", "full"] as const) {
      const ms = jdeToMs(phaseJde(phase === "new" ? k : k + 0.5, phase));
      if (ms >= toMs) return out;
      if (ms >= fromMs) out.push({ phase, at: new Date(ms).toISOString() });
    }
  }
  return out;
}
