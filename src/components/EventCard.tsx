"use client";

import Link from "next/link";
import Cover from "./Cover";
import { toText } from "@/lib/text";
import { dayNum, fmtDate, fmtTime, fmtWeekday, monthShort } from "@/lib/data";
import { useLang } from "@/lib/i18n/client";
import { eventAltTitle, eventDescription, eventLocation, eventRoute, eventTitle } from "@/lib/i18n/content";
import type { Key } from "@/lib/i18n";
import type { FestEvent } from "@/lib/types";

const CAT: Record<string, Key> = { general: "events.catUpcoming", procession: "events.processions", pooja: "events.poojaRituals", community: "events.community" };

export default function EventCard({ e, past = false }: { e: FestEvent; past?: boolean }) {
  const { t, lang } = useLang();
  const routed = e.route_start || e.route_via || e.route_end;
  const r = eventRoute(e, lang);
  const alt = eventAltTitle(e, lang);
  const desc = toText(eventDescription(e, lang));
  const loc = eventLocation(e, lang);
  return (
    <article className="royal-card flex flex-col overflow-hidden">
      <div className="relative">
        <Cover src={e.cover_url} className="h-40" />
        <div className="absolute left-3 top-3 rounded-lg bg-white px-3 py-1.5 text-center shadow">
          <div className="font-display text-2xl font-bold leading-none text-burgundy">{dayNum(e.starts_at)}</div>
          <div className="text-[10px] font-semibold tracking-wider text-burgundy/70">{monthShort(e.starts_at, lang)}</div>
        </div>
        <span className="absolute right-3 top-3 rounded-md bg-burgundy/90 px-2.5 py-1 text-xs font-medium text-white">{past ? t("events.past") : t(CAT[e.category ?? "general"])}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-telugu text-xl font-bold text-burgundy">{eventTitle(e, lang)}</h3>
        {alt && <p className="text-xs text-burgundy/60">{alt}</p>}
        <ul className="mt-3 space-y-1 text-sm text-burgundy-dark/90">
          <li><span aria-hidden>🗓️ </span>{fmtDate(e.starts_at, lang)}, {fmtWeekday(e.starts_at, lang)}</li>
          <li><span aria-hidden>🕖 </span>{t("events.onwards", { time: fmtTime(e.starts_at, lang) })}</li>
          {routed ? (
            <li className="flex gap-1"><span aria-hidden>📍</span>
              <span>
                {r.start && <span className="block"><b>{t("events.start")}</b> {r.start}</span>}
                {r.via && <span className="block"><b>{t("events.via")}</b> {r.via}</span>}
                {r.end && <span className="block"><b>{t("events.destination")}</b> {r.end}</span>}
              </span>
            </li>
          ) : loc && <li><span aria-hidden>📍 </span>{loc}</li>}
        </ul>
        {desc && <p className="mt-3 line-clamp-3 font-telugu text-sm leading-relaxed text-burgundy-dark/80">{desc}</p>}
        <Link href={`/events/${e.id}`} className="btn-royal mt-4 self-start !py-2">{t("events.viewDetails")}</Link>
      </div>
    </article>
  );
}
