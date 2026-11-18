import { useSettings } from "~/lib/settings-store";
import { FONT, PALETTES, type Palette } from "./tokens";

export interface Theme {
  name: "ink" | "light";
  c: Palette;
  /** Cỡ chữ đã cộng thang "chữ lớn" (+2) nếu bật (S-08). */
  f: Record<keyof typeof FONT, number>;
}

export function useTheme(): Theme {
  const name = useSettings((s) => s.theme);
  const large = useSettings((s) => s.largeText);
  const f = Object.fromEntries(Object.entries(FONT).map(([k, v]) => [k, large && k !== "hero" ? v + 2 : v])) as Theme["f"];
  return { name, c: PALETTES[name], f };
}
