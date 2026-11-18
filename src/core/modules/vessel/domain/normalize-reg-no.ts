/**
 * BR-13: chuẩn hoá số hiệu để so khớp/tìm kiếm — bỏ dấu tiếng Việt, bỏ khoảng trắng và dấu gạch, viết HOA.
 * "QNg 95172 TS" → "QNG95172TS"; "ĐNa-90102" → "DNA90102".
 */
export function normalizeRegNo(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "D")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** Khớp tìm kiếm: chuỗi người dùng gõ (đã chuẩn hoá) là tiền tố hoặc chuỗi con của regNoNormalized. */
export function matchesRegNo(query: string, regNoNormalized: string): boolean {
  const q = normalizeRegNo(query);
  if (q.length === 0) return true;
  return regNoNormalized.includes(q);
}
