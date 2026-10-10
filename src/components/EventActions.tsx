"use client";

import type { FestEvent } from "@/lib/types";

const ics = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");

export default function EventActions({ e }: { e: FestEvent }) {
  function addToCalendar() {
    const s = new Date(e.starts_at); const end = new Date(s.getTime() + 2 * 3600_000);
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `UID:${e.id}@team-mahathi`, `DTSTAMP:${ics(new Date())}`, `DTSTART:${ics(s)}`, `DTEND:${ics(end)}`,
      `SUMMARY:${e.title}`, `LOCATION:${[e.route_start, e.route_end || e.location].filter(Boolean).join(" to ")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
    a.download = `${e.title.replace(/\W+/g, "-")}.ics`; a.click(); URL.revokeObjectURL(a.href);
  }
  async function share() {
    if (navigator.share) { try { await navigator.share({ title: e.title, url: location.href }); } catch {} }
    else await navigator.clipboard?.writeText(location.href);
  }
  return (
    <div className="mt-4 space-y-2">
      <button onClick={addToCalendar} className="btn-royal w-full">🗓️ Add to Calendar</button>
      <button onClick={share} className="btn-ghost w-full">Share Event</button>
    </div>
  );
}
