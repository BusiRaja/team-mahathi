"use client";

import type { FestEvent } from "@/lib/types";
import { useLang } from "@/lib/i18n/client";
import { eventTitle, eventWhere } from "@/lib/i18n/content";

const ics = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");

export default function EventActions({ e }: { e: FestEvent }) {
  const { t, lang } = useLang();
  const title = eventTitle(e, lang);
  function addToCalendar() {
    const s = new Date(e.starts_at); const end = new Date(s.getTime() + 2 * 3600_000);
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `UID:${e.id}@team-mahathi`, `DTSTAMP:${ics(new Date())}`, `DTSTART:${ics(s)}`, `DTEND:${ics(end)}`,
      `SUMMARY:${title}`, `LOCATION:${eventWhere(e, lang).replace(" → ", " to ")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
    a.download = `${e.title.replace(/\W+/g, "-")}.ics`; a.click(); URL.revokeObjectURL(a.href);
  }
  async function share() {
    if (navigator.share) { try { await navigator.share({ title, url: location.href }); } catch {} }
    else await navigator.clipboard?.writeText(location.href);
  }
  return (
    <div className="mt-4 space-y-2">
      <button onClick={addToCalendar} className="btn-royal w-full">{t("events.addToCalendar")}</button>
      <button onClick={share} className="btn-ghost w-full">{t("events.share")}</button>
    </div>
  );
}
