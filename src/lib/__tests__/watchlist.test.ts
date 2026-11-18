// Fixture §11.1 chạy qua đường tính của app mobile — phải ra đúng kết quả như web (A-01).
import { describe, expect, it } from "vitest";
import { FIXTURE_NOW, fixtureStorm, fixtureVessels } from "~/core/modules/risk/__fixtures__/ba-bd-002";
import { buildWatchlist } from "../watchlist";

describe("buildWatchlist (mobile) — BA-BD-002 §11.1", () => {
  it("AT-01: thứ tự, bộ đếm, băng trạng thái", () => {
    const w = buildWatchlist([fixtureStorm], fixtureVessels, FIXTURE_NOW, null);
    expect(w.vessels.map((v) => v.regNo)).toEqual(["QNg 95172 TS", "QNg 90567 TS", "BĐ 96231 TS", "KH 91188 TS", "ĐNa 90102"]);
    expect(w.counts).toEqual({ danger: 1, warn: 0, watch: 3, safe: 1 });
    expect(w.summary).toEqual({ kind: "affected", n: 1 });
    expect(w.vessels[0]?.risk.etaGaleHours).toBe("inside");
  });

  it("AT-08: không có bão → mọi ghe safe (no_storm)", () => {
    const w = buildWatchlist([], fixtureVessels, FIXTURE_NOW, null);
    expect(w.summary).toEqual({ kind: "no_storm" });
    expect(w.vessels.every((v) => v.risk.level === "safe" && v.risk.levelReason === "no_storm")).toBe(true);
  });

  it("S-06 2b: ghe tạm dừng xuống cuối và không tính vào bộ đếm", () => {
    const vessels = fixtureVessels.map((v) => (v.regNo === "QNg 95172 TS" ? { ...v, status: "paused" as const } : v));
    const w = buildWatchlist([fixtureStorm], vessels, FIXTURE_NOW, null);
    expect(w.vessels.at(-1)?.regNo).toBe("QNg 95172 TS");
    expect(w.counts.danger).toBe(0);
    expect(w.summary).toEqual({ kind: "none" });
  });

  it("BR-21: ngưỡng chung chỉ mở rộng THEO DÕI, không hạ mức", () => {
    const w = buildWatchlist([fixtureStorm], fixtureVessels, FIXTURE_NOW, 800);
    const dna = w.vessels.find((v) => v.regNo === "ĐNa 90102");
    expect(dna?.risk.level).toBe("watch");
    expect(w.vessels[0]?.risk.level).toBe("danger");
  });
});

import { fromPhoneTime, toPhoneTime } from "../time-input";

describe("time-input (S-03, A-05)", () => {
  it("GMT+7 ↔ UTC", () => {
    expect(toPhoneTime("2026-09-17T09:53:00Z")).toBe("16:53 17/09/2026");
    expect(fromPhoneTime("16:53 17/09/2026")).toBe("2026-09-17T09:53:00.000Z");
    expect(fromPhoneTime("7:05 1/1/2026")).toBe("2026-01-01T00:05:00.000Z");
    expect(fromPhoneTime("16h53")).toBeNull();
  });
});
