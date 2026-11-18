// §8.3 "Nhãn chống chồng lấn": 6 vị trí ứng viên, bỏ vị trí tràn khung hoặc chạm nhãn đã đặt; giữ trống 36×36 quanh tâm bão.

export interface LabelRequest {
  id: string;
  x: number;
  y: number;
  text: string;
  priority: number; // thấp hơn = đặt trước
  fontSize: number;
  /** Loại nhãn để CSS phân biệt (ghe/bão mặc định, địa danh, tỉnh). */
  kind?: "default" | "place" | "province";
}

export interface PlacedLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  anchor: "start" | "end";
  fontSize: number;
  kind: "default" | "place" | "province";
}

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const overlaps = (a: Box, b: Box) => !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);

/** Ước lượng bề rộng chữ Archivo 800 ~0.62em/ký tự. */
export function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.62;
}

/** [dx, dy, anchor] — phải-trên, phải-dưới, trái-trên, trái-dưới, phải-xa-trên, phải-xa-dưới. */
const CANDIDATES: Array<[number, number, "start" | "end"]> = [
  [10, -6, "start"],
  [10, 12, "start"],
  [-10, -6, "end"],
  [-10, 12, "end"],
  [22, -14, "start"],
  [22, 20, "start"],
];

export function placeLabels(
  requests: readonly LabelRequest[],
  frame: { width: number; height: number },
  reserved: readonly Box[] = [],
): PlacedLabel[] {
  const placed: PlacedLabel[] = [];
  const taken: Box[] = [...reserved];
  const sorted = [...requests].sort((a, b) => a.priority - b.priority);

  for (const r of sorted) {
    const w = estimateTextWidth(r.text, r.fontSize);
    const h = r.fontSize * 1.2;
    for (const [dx, dy, anchor] of CANDIDATES) {
      const x = r.x + dx;
      const y = r.y + dy;
      const box: Box = anchor === "start" ? { x1: x, y1: y - h, x2: x + w, y2: y + 2 } : { x1: x - w, y1: y - h, x2: x, y2: y + 2 };
      if (box.x1 < 0 || box.y1 < 0 || box.x2 > frame.width || box.y2 > frame.height) continue;
      if (taken.some((t) => overlaps(t, box))) continue;
      taken.push(box);
      placed.push({ id: r.id, text: r.text, x, y, anchor, fontSize: r.fontSize, kind: r.kind ?? "default" });
      break;
    }
  }
  return placed;
}

/** Vùng giữ trống 36×36 px quanh tâm bão. */
export function stormExclusion(x: number, y: number): Box {
  return { x1: x - 18, y1: y - 18, x2: x + 18, y2: y + 18 };
}
