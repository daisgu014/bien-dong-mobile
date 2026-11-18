// Ghe người dùng tự thêm trên điện thoại (S-03/S-06) — lưu AsyncStorage, giống kho localStorage của web
// (src/modules/vessel/infrastructure/local-store.ts, BA-BD-002 §2.4). Vị trí chỉ thêm, không sửa (A-02); giữ 90 ngày (BR-17).
// TODO(BA-BD-002 §12): đồng bộ lên máy chủ khi có DB + đăng nhập; gỡ app là mất dữ liệu.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Vessel, VesselPosition } from "@/modules/risk";
import { TRAIL_RETENTION_DAYS } from "@/modules/vessel";

export const LOCAL_ID_PREFIX = "local-";

export function newLocalVesselId(): string {
  return `${LOCAL_ID_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function pruneTrail(list: VesselPosition[], now: string): VesselPosition[] {
  const min = new Date(now).getTime() - TRAIL_RETENTION_DAYS * 86_400_000;
  return list.filter((p) => new Date(p.at).getTime() >= min).sort((a, b) => a.at.localeCompare(b.at));
}

interface VesselState {
  vessels: Vessel[];
  add: (v: Vessel) => void;
  remove: (id: string) => void;
  appendPosition: (id: string, p: VesselPosition, now: string) => void;
  setPaused: (id: string, paused: boolean) => void;
  setLabel: (id: string, label: string | null) => void;
  clear: () => void;
}

export const useVesselStore = create<VesselState>()(
  persist(
    (set) => ({
      vessels: [],
      add: (v) => set((s) => ({ vessels: [...s.vessels, v] })),
      remove: (id) => set((s) => ({ vessels: s.vessels.filter((v) => v.id !== id) })),
      appendPosition: (id, p, now) =>
        set((s) => ({
          vessels: s.vessels.map((v) => {
            if (v.id !== id) return v;
            const trail = pruneTrail([...v.trail, p], now);
            return { ...v, trail, lastPosition: trail[trail.length - 1] ?? null };
          }),
        })),
      setPaused: (id, paused) =>
        set((s) => ({ vessels: s.vessels.map((v) => (v.id === id ? { ...v, status: paused ? ("paused" as const) : ("active" as const) } : v)) })),
      setLabel: (id, label) => set((s) => ({ vessels: s.vessels.map((v) => (v.id === id ? { ...v, label } : v)) })),
      clear: () => set({ vessels: [] }),
    }),
    { name: "bien-dong.local-vessels.v1", storage: createJSONStorage(() => AsyncStorage), version: 1 },
  ),
);
