"use client";

import { useState } from "react";

export default function MiniCalendar({ eventDates }: { eventDates: string[] }) {
  const today = new Date();
  const [cur, setCur] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const evKeys = new Set(eventDates.map((iso) => key(new Date(iso))));
  const start = new Date(cur); start.setDate(1 - cur.getDay());
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const move = (n: number) => setCur(new Date(cur.getFullYear(), cur.getMonth() + n, 1));
  return (
    <div className="royal-card p-4">
      <h2 className="font-display text-lg font-bold text-burgundy">Events Calendar</h2>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span>{cur.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
        <span className="flex gap-3 text-burgundy">
          <button onClick={() => move(-1)} aria-label="Previous month">←</button>
          <button onClick={() => move(1)} aria-label="Next month">→</button>
        </span>
      </div>
      <div className="mt-2 grid grid-cols-7 text-center text-xs text-burgundy/60">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-1">{d}</div>)}</div>
      <div className="grid grid-cols-7 text-center text-sm">
        {days.map((d) => {
          const out = d.getMonth() !== cur.getMonth();
          const isToday = key(d) === key(today);
          const has = evKeys.has(key(d));
          return (
            <div key={key(d)} className="grid h-9 place-items-center">
              <span className={`relative grid h-8 w-8 place-items-center rounded-full ${isToday ? "bg-burgundy font-semibold text-white" : has ? "bg-blush font-semibold text-burgundy" : out ? "text-burgundy/25" : ""}`}>
                {d.getDate()}
                {has && !isToday && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-burgundy" />}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
