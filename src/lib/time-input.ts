import { fromGmt7InputValue, partsGmt7 } from "@/shared/format/gmt7";

/** "HH:mm dd/MM/yyyy" theo GMT+7 — dễ gõ trên bàn phím số điện thoại hơn định dạng ISO. */
export function toPhoneTime(iso: string | Date): string {
  const p = partsGmt7(iso);
  return `${p.hh}:${p.mm} ${p.dd}/${p.MM}/${p.yyyy}`;
}

/** Ngược lại → ISO UTC (A-05). Sai định dạng → null. */
export function fromPhoneTime(value: string): string | null {
  const m = /^\s*(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(value);
  if (!m) return null;
  const [, h, mi, d, mo, y] = m as unknown as [string, string, string, string, string, string];
  const pad = (s: string) => s.padStart(2, "0");
  return fromGmt7InputValue(`${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${mi}`);
}
