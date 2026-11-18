// Bảng màu lấy từ src/shared/ui/tokens.css của web (BA-BD-002 §8.4, §9.2, §9.4) — giữ cùng giá trị.
// `ink` (nền tối) là mặc định; `light` tương phản cao dùng dưới nắng (Q-05).
import type { RiskLevel } from "@/modules/risk";

export type ThemeName = "ink" | "light";

export interface Palette {
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  muted: string;
  divider: string;
  border: string;
  primary: string;
  primaryButton: string;
  onPrimary: string;
  primaryText: string;
  accent: string;
  accent700: string;
  live: string;
  risk: Record<RiskLevel, { symbol: string; tagBg: string; tagFg: string }>;
  map: {
    sea: string;
    land: string;
    landVn: string;
    border: string;
    coast: string;
    grid: string;
    ink: string;
    accent: string;
    muted: string;
    halo: string;
    seaLabel: string;
  };
}

export const PALETTES: Record<ThemeName, Palette> = {
  ink: {
    bg: "#18243a",
    surface: "#202e48",
    surface2: "#283853",
    text: "#eef3fb",
    muted: "#b3c0d6",
    divider: "rgba(170, 196, 240, 0.12)",
    border: "rgba(170, 196, 240, 0.2)",
    primary: "#2f7ff0",
    primaryButton: "#1f6feb",
    onPrimary: "#ffffff",
    primaryText: "#8ec1ff",
    accent: "#ff453a",
    accent700: "#d42a1f",
    live: "#34d399",
    risk: {
      danger: { symbol: "#ff453a", tagBg: "#d42a1f", tagFg: "#ffffff" },
      warn: { symbol: "#ff9f0a", tagBg: "rgba(255, 159, 10, 0.16)", tagFg: "#ffc46b" },
      watch: { symbol: "#8a9dbf", tagBg: "#36496b", tagFg: "#d3dcec" },
      safe: { symbol: "#6ee7b7", tagBg: "rgba(52, 211, 153, 0.13)", tagFg: "#6ee7b7" },
    },
    map: {
      sea: "#1a3150",
      land: "#2b3b5a",
      landVn: "#3a5078",
      border: "#7489b0",
      coast: "#6d8ab6",
      grid: "rgba(140, 185, 255, 0.13)",
      ink: "#eef3fb",
      accent: "#ff5a4f",
      muted: "#b7c4da",
      halo: "#1a3150",
      seaLabel: "rgba(170, 200, 240, 0.38)",
    },
  },
  light: {
    bg: "#eef2f7",
    surface: "#ffffff",
    surface2: "#f5f7fb",
    text: "#0b1526",
    muted: "#55627a",
    divider: "rgba(15, 30, 60, 0.08)",
    border: "rgba(15, 30, 60, 0.14)",
    primary: "#0a66d8",
    primaryButton: "#0a66d8",
    onPrimary: "#ffffff",
    primaryText: "#0450ad",
    accent: "#ff3b30",
    accent700: "#b91c1c",
    live: "#0b6e4c",
    risk: {
      danger: { symbol: "#e5261b", tagBg: "#b91c1c", tagFg: "#ffffff" },
      warn: { symbol: "#ff9f0a", tagBg: "#fff3d6", tagFg: "#7a4a00" },
      watch: { symbol: "#9aa6ba", tagBg: "#eaeef5", tagFg: "#36425a" },
      safe: { symbol: "#135c3c", tagBg: "#e3f7ee", tagFg: "#135c3c" },
    },
    map: {
      sea: "#d5e3f1",
      land: "#eceff4",
      landVn: "#fbfcfe",
      border: "#7a879d",
      coast: "#5b6880",
      grid: "rgba(11, 21, 38, 0.15)",
      ink: "#0b1526",
      accent: "#e5261b",
      muted: "#36425a",
      halo: "#d5e3f1",
      seaLabel: "rgba(30, 70, 120, 0.55)",
    },
  },
};

/** Thang chữ §9.1 (tối thiểu 13 px trên app — GAP-01). */
export const FONT = { xs: 13, sm: 14, md: 15, lg: 17, xl: 19, xxl: 23, hero: 44 } as const;
export const RADIUS = { sm: 8, md: 12, lg: 16 } as const;
export const GUTTER = 16;
