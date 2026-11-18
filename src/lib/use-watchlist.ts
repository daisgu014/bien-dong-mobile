import { useEffect, useMemo, useState } from "react";
import { useSettings } from "./settings-store";
import { useStorms } from "./queries";
import { useVesselStore } from "./vessel-store";
import { buildWatchlist } from "./watchlist";

/** Đồng hồ phút — risk-engine nhận `now` qua tham số (CLAUDE.md quy tắc 8). */
export function useNowMinute(): string {
  const [now, setNow] = useState(() => new Date().toISOString());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date().toISOString()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Bão (API web) + ghe trên máy → watchlist đã tính mức trên thiết bị (A-01). */
export function useWatchlist() {
  const storms = useStorms();
  const vessels = useVesselStore((s) => s.vessels);
  const thresholdKm = useSettings((s) => s.thresholdKm);
  const now = useNowMinute();
  const stormList = useMemo(() => (storms.data?.data ?? []).map((s) => s.storm), [storms.data]);
  const watchlist = useMemo(() => buildWatchlist(stormList, vessels, now, thresholdKm), [stormList, vessels, now, thresholdKm]);
  const primaryMeta = storms.data?.data.find((s) => s.storm.id === watchlist.primary?.id) ?? null;
  return { storms, watchlist, primaryMeta, now };
}
