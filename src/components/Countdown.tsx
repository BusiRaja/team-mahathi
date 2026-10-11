"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/client";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return { d: Math.floor(ms / 86400000), h: Math.floor((ms / 3600000) % 24), m: Math.floor((ms / 60000) % 60), s: Math.floor((ms / 1000) % 60), done: ms === 0 };
}

export default function Countdown({ target, label }: { target: string; label: string }) {
  const { t: tr } = useLang();
  const t = new Date(target).getTime();
  const [v, setV] = useState<ReturnType<typeof diff> | null>(null);
  useEffect(() => {
    setV(diff(t));
    const id = setInterval(() => setV(diff(t)), 1000);
    return () => clearInterval(id);
  }, [t]);
  const cells: [string, number][] = v ? [[tr("count.days"), v.d], [tr("count.hours"), v.h], [tr("count.mins"), v.m], [tr("count.secs"), v.s]] : [[tr("count.days"), 0], [tr("count.hours"), 0], [tr("count.mins"), 0], [tr("count.secs"), 0]];
  return (
    <div className="mt-5" role="timer" aria-label={label}>
      <p className="mb-2 text-sm font-medium text-burgundy">{v?.done ? tr("count.live") : label}</p>
      <div className="flex gap-2">
        {cells.map(([k, n]) => (
          <div key={k} className="w-16 rounded-lg bg-burgundy py-2 text-center ring-1 ring-gold/60">
            <div className="font-display text-2xl font-bold tabular-nums text-gold-light">{String(n).padStart(2, "0")}</div>
            <div className="text-[10px] tracking-wider text-ivory/80">{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
