"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import EventCard from "./EventCard";
import MiniCalendar from "./MiniCalendar";
import Cover from "./Cover";
import { dayNum, fmtTime, monthShort } from "@/lib/data";
import { useLang } from "@/lib/i18n/client";
import { eventTitle, eventLocation, eventRoute } from "@/lib/i18n/content";
import type { Key } from "@/lib/i18n";
import { useSignedIn } from "@/lib/useSession";
import type { FestEvent } from "@/lib/types";

const CHIPS: { key: string; label: Key }[] = [
  { key: "all", label: "events.all" }, { key: "upcoming", label: "events.upcomingChip" }, { key: "past", label: "events.pastChip" },
  { key: "procession", label: "events.processions" }, { key: "pooja", label: "events.poojaRituals" }, { key: "community", label: "events.community" },
];

export default function EventsExplorer({ events }: { events: FestEvent[] }) {
  const { t, lang } = useLang();
  const [chip, setChip] = useState("all");
  const now = Date.now();
  const isUp = (e: FestEvent) => new Date(e.starts_at).getTime() >= now - 6 * 3600_000;
  const shown = useMemo(() => events.filter((e) => {
    if (chip === "upcoming") return isUp(e);
    if (chip === "past") return !isUp(e);
    if (["procession", "pooja", "community"].includes(chip)) return e.category === chip;
    return true;
  }), [events, chip]); // eslint-disable-line react-hooks/exhaustive-deps
  const upcoming = shown.filter(isUp);
  const past = events.filter((e) => !isUp(e));
  const pastByYear = [...new Set(past.map((e) => new Date(e.starts_at).getFullYear()))].sort((a, b) => b - a);
  const next = events.find(isUp);

  return (
    <div className="wrap grid gap-8 py-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="tablist">
          {CHIPS.map((c) => (
            <button key={c.key} role="tab" aria-selected={chip === c.key} onClick={() => setChip(c.key)} className={`chip ${chip === c.key ? "chip-active" : ""}`}>{t(c.label)}</button>
          ))}
        </div>

        <h2 className="section-title underline-rule mt-6">{chip === "past" ? t("events.pastTitle") : t("events.upcomingTitle")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(chip === "past" ? past : upcoming).map((e) => <EventCard key={e.id} e={e} past={!isUp(e)} />)}
        </div>
        {!(chip === "past" ? past : upcoming).length && <p className="royal-card mt-4 p-6 text-center">{t("events.nothing")}</p>}

        {pastByYear.length > 0 && chip !== "past" && (
          <>
            <div className="mt-10 flex items-end justify-between"><h2 className="section-title underline-rule">{t("events.pastTitle")}</h2><Link href="/albums" className="text-sm font-medium text-burgundy">{t("events.viewAll")}</Link></div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {pastByYear.slice(0, 4).map((y) => {
                const e = past.find((p) => new Date(p.starts_at).getFullYear() === y)!;
                return (
                  <Link key={y} href={`/albums/${y}`} className="group relative block overflow-hidden rounded-xl">
                    <Cover src={e.cover_url} className="h-24" width={400} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-3 text-white"><div className="font-display text-xl font-bold">{y}</div><div className="font-telugu text-xs">{eventTitle(e, lang)}</div></div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      <aside className="space-y-5">
        <MiniCalendar eventDates={events.map((e) => e.starts_at)} />
        {next && (
          <div className="royal-card bg-blush p-4">
            <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold text-burgundy">{dayNum(next.starts_at) === dayNum(new Date().toISOString()) ? t("events.today") : t("events.next")}</h2><Link href={`/events/${next.id}`} aria-label={t("events.openEvent")}>→</Link></div>
            <div className="mt-3 flex gap-3">
              <Cover src={next.cover_url} className="h-16 w-16 shrink-0 rounded-lg" width={150} />
              <div className="text-sm">
                <p className="font-telugu font-bold text-burgundy">{eventTitle(next, lang)}</p>
                <p className="text-burgundy/70">{dayNum(next.starts_at)} {monthShort(next.starts_at, lang)} · {fmtTime(next.starts_at, lang)}</p>
                <p className="text-burgundy/70">{eventRoute(next, lang).start || eventLocation(next, lang)}</p>
              </div>
            </div>
            <Link href={`/events/${next.id}`} className="mt-3 inline-block text-sm font-semibold text-burgundy">{t("events.viewEventArrow")}</Link>
          </div>
        )}
        <QuickLinks />
      </aside>
    </div>
  );
}

export function QuickLinks({ items }: { items?: { href: string; label: Key; icon: string; signedOutOnly?: boolean }[] }) {
  const signedIn = useSignedIn();
  const { t } = useLang();
  const list = items ?? [
    { href: "/events", label: "quick.calendar" as Key, icon: "🗓️" }, { href: "/gallery", label: "quick.photos" as Key, icon: "🖼️" },
    { href: "/gallery", label: "quick.videos" as Key, icon: "▶" }, { href: "/albums", label: "quick.pastEvents" as Key, icon: "🕘" },
  ];
  return (
    <div className="royal-card p-4">
      <h2 className="font-display text-lg font-bold text-burgundy">{t("events.quickLinks")}</h2>
      <ul className="mt-2 divide-y divide-gold/20">
        {list.filter((l) => !l.signedOutOnly || signedIn === false).map((l) => (
          <li key={l.label + l.href}><Link href={l.href} className="flex items-center justify-between py-2.5 text-sm hover:text-burgundy"><span><span aria-hidden className="mr-2">{l.icon}</span>{t(l.label)}</span><span aria-hidden>→</span></Link></li>
        ))}
      </ul>
    </div>
  );
}
