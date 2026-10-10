"use client";

import { useLang } from "@/lib/i18n/client";
import type { Lang } from "@/lib/i18n";

const OPTIONS: { lang: Lang; label: string }[] = [
  { lang: "en", label: "EN" },
  { lang: "te", label: "తెలుగు" },
];

/** Two-way language toggle. The choice is stored in a cookie so server pages render in that language. */
export default function LangSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  return (
    <div role="group" aria-label={t("lang.label")} className={`inline-flex shrink-0 overflow-hidden rounded-full border border-burgundy/40 bg-white text-xs font-semibold ${className}`}>
      {OPTIONS.map((o) => (
        <button
          key={o.lang}
          type="button"
          lang={o.lang}
          aria-pressed={lang === o.lang}
          aria-label={t("lang.switchTo", { lang: t(`lang.${o.lang}`) })}
          onClick={() => lang !== o.lang && setLang(o.lang)}
          className={`px-3 py-1.5 font-telugu transition ${lang === o.lang ? "bg-burgundy text-white" : "text-burgundy hover:bg-burgundy/5"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
