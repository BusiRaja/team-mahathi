"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CATEGORIES, type Category, type Deity, type Media } from "@/lib/types";
import { useLang } from "@/lib/i18n/client";
import { mediaCaption } from "@/lib/i18n/content";
import type { Key } from "@/lib/i18n";
import { optimize } from "@/lib/cloudinary-client";

type Filter<T> = T | "all";

export default function Gallery({
  items,
  filters = true,
  initialDeity = "all",
}: {
  items: Media[];
  filters?: boolean;
  initialDeity?: Filter<Deity>;
}) {
  const { t, lang } = useLang();
  const [cat, setCat] = useState<Filter<Category>>("all");
  const [deity, setDeity] = useState<Filter<Deity>>(initialDeity);
  const [type, setType] = useState<Filter<"photo" | "video">>("all");
  const [open, setOpen] = useState<number | null>(null);

  const shown = useMemo(
    () =>
      items.filter(
        (m) =>
          (cat === "all" || m.category === cat) &&
          (deity === "all" || m.deity === deity || m.deity === "both") &&
          (type === "all" || m.type === type)
      ),
    [items, cat, deity, type]
  );

  const usedCats = useMemo(() => CATEGORIES.filter((c) => items.some((m) => m.category === c.value)), [items]);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + shown.length) % shown.length)),
    [shown.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, step]);

  const share = async (m: Media) => {
    const data = { title: mediaCaption(m, lang) ?? t("gallery.festivalMemory"), url: m.url };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(m.url);
        alert(t("gallery.copied"));
      }
    } catch {}
  };

  const current = open !== null ? shown[open] : null;

  return (
    <div>
      {filters && items.length > 0 && (
        <div className="mb-5 space-y-2">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {([["all", "gallery.all"], ["ganesha", "deity.ganeshaShort"], ["durga", "deity.durgaShort"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setDeity(v)} className={`chip ${deity === v ? "chip-active" : ""}`}>{t(l as Key)}</button>
            ))}
            <span className="mx-1 w-px bg-gold/50" />
            {([["all", "gallery.photosVideos"], ["photo", "gallery.photos"], ["video", "gallery.videos"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setType(v)} className={`chip ${type === v ? "chip-active" : ""}`}>{t(l as Key)}</button>
            ))}
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setCat("all")} className={`chip ${cat === "all" ? "chip-active" : ""}`}>{t("gallery.allEvents")}</button>
            {usedCats.map((c) => (
              <button key={c.value} onClick={() => setCat(c.value)} className={`chip ${cat === c.value ? "chip-active" : ""}`}>{t(`cat.${c.value}` as Key)}</button>
            ))}
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="royal-card p-10 text-center font-serif text-xl text-burgundy/80">{t("gallery.empty")}</div>
      ) : (
        <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
          {shown.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              onClick={() => setOpen(i)}
              className="group relative mb-3 block w-full overflow-hidden rounded-xl border border-gold/40 bg-burgundy/10 shadow-royal"
            >
              {m.type === "photo" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={optimize(m.url, 600)} alt={mediaCaption(m, lang) ?? t("gallery.festivalPhoto")} loading="lazy" className="w-full transition duration-500 group-hover:scale-105" />
              ) : (
                <div className="relative">
                  <video src={`${m.url}#t=0.1`} preload="metadata" muted playsInline className="w-full" />
                  <span className="absolute inset-0 grid place-items-center bg-black/25 text-4xl text-white">▶</span>
                </div>
              )}
              {mediaCaption(m, lang) && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left text-xs text-white opacity-0 transition group-hover:opacity-100">
                  {mediaCaption(m, lang)}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {current && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-black/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <div className="flex items-center justify-between p-3 text-ivory" onClick={(e) => e.stopPropagation()}>
              <span className="text-xs text-gold-light">{(open ?? 0) + 1} / {shown.length}</span>
              <div className="flex gap-2">
                <button className="btn-ghost !border-gold/60 !py-1.5 !text-ivory" onClick={() => share(current)}>{t("gallery.share")}</button>
                <a className="btn-ghost !border-gold/60 !py-1.5 !text-ivory" href={current.url} target="_blank" rel="noreferrer" download>{t("gallery.save")}</a>
                <button className="btn-royal !py-1.5" onClick={close}>✕</button>
              </div>
            </div>
            <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2" onClick={(e) => e.stopPropagation()}>
              <button aria-label={t("gallery.prev")} onClick={() => step(-1)} className="absolute left-2 z-10 rounded-full bg-black/50 px-3 py-2 text-2xl text-gold-light">‹</button>
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -80) step(1);
                    else if (info.offset.x > 80) step(-1);
                  }}
                  className="flex max-h-full max-w-full items-center justify-center"
                >
                  {current.type === "photo" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={optimize(current.url, 1600)} alt={mediaCaption(current, lang) ?? ""} className="max-h-[78vh] max-w-full rounded-lg object-contain" />
                  ) : (
                    <video src={current.url} controls autoPlay playsInline className="max-h-[78vh] max-w-full rounded-lg" />
                  )}
                </motion.div>
              </AnimatePresence>
              <button aria-label={t("gallery.next")} onClick={() => step(1)} className="absolute right-2 z-10 rounded-full bg-black/50 px-3 py-2 text-2xl text-gold-light">›</button>
            </div>
            {mediaCaption(current, lang) && <p className="p-3 text-center font-serif text-lg text-ivory">{mediaCaption(current, lang)}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
