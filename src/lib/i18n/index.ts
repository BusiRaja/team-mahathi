import en, { type Key } from "./en";
import te from "./te";

export type Lang = "en" | "te";
export const LANGS: Lang[] = ["en", "te"];
export const DEFAULT_LANG: Lang = "en";
export const LANG_COOKIE = "lang";
export const isLang = (v: unknown): v is Lang => v === "en" || v === "te";

const dicts: Record<Lang, Record<Key, string>> = { en, te };

export type TFn = (key: Key, vars?: Record<string, string | number>) => string;

/** Returns a translate function for a language. Missing Telugu keys fall back to English. */
export function translator(lang: Lang): TFn {
  const d = dicts[lang];
  return (key, vars) => {
    let s = d[key] ?? en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}

/** Intl locale for dates. */
export const localeOf = (lang: Lang) => (lang === "te" ? "te-IN" : "en-IN");

/** Pick the text for a language, falling back to the other language when empty. */
export function pick<T extends string | null | undefined>(lang: Lang, en_: T, te_: T): string {
  const a = lang === "te" ? te_ : en_;
  const b = lang === "te" ? en_ : te_;
  return (a && String(a).trim() ? a : b) || "";
}

export type { Key };
