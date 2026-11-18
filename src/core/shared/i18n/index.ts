import { vi } from "./vi";
import { en } from "./en";

type Leaves<T, P extends string = ""> = T extends string
  ? P
  : { [K in keyof T & string]: Leaves<T[K], P extends "" ? K : `${P}.${K}`> }[keyof T & string];

export type I18nKey = Leaves<typeof vi>;
export type I18nKeyEn = Leaves<typeof en>;

function lookup(dict: object, key: string): string {
  let cur: unknown = dict;
  for (const part of key.split(".")) {
    if (cur && typeof cur === "object" && part in cur) cur = (cur as Record<string, unknown>)[part];
    else return key;
  }
  return typeof cur === "string" ? cur : key;
}

function interpolate(s: string, params?: Record<string, string | number>): string {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? String(params[k]) : `{${k}}`));
}

/** Chuỗi tiếng Việt. Thiếu key thì trả lại key để dễ phát hiện. */
export function t(key: I18nKey, params?: Record<string, string | number>): string {
  return interpolate(lookup(vi, key), params);
}

/** Phụ đề tiếng Anh (nhãn phụ trong design). */
export function tEn(key: I18nKeyEn, params?: Record<string, string | number>): string {
  return interpolate(lookup(en, key), params);
}

export { vi, en };
