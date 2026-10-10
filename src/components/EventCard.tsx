import Link from "next/link";
import Cover from "./Cover";
import { toText } from "@/lib/text";
import { dayNum, fmtDate, fmtTime, fmtWeekday, monthShort } from "@/lib/data";
import type { FestEvent } from "@/lib/types";

const CAT: Record<string, string> = { general: "Upcoming", procession: "Procession", pooja: "Pooja & Rituals", community: "Community" };

export default function EventCard({ e, past = false }: { e: FestEvent; past?: boolean }) {
  const routed = e.route_start || e.route_via || e.route_end;
  return (
    <article className="royal-card flex flex-col overflow-hidden">
      <div className="relative">
        <Cover src={e.cover_url} className="h-40" />
        <div className="absolute left-3 top-3 rounded-lg bg-white px-3 py-1.5 text-center shadow">
          <div className="font-display text-2xl font-bold leading-none text-burgundy">{dayNum(e.starts_at)}</div>
          <div className="text-[10px] font-semibold tracking-wider text-burgundy/70">{monthShort(e.starts_at)}</div>
        </div>
        <span className="absolute right-3 top-3 rounded-md bg-burgundy/90 px-2.5 py-1 text-xs font-medium text-white">{past ? "Past" : CAT[e.category ?? "general"]}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-telugu text-xl font-bold text-burgundy">{e.title_te || e.title}</h3>
        {e.title_te && <p className="text-xs text-burgundy/60">{e.title}</p>}
        <ul className="mt-3 space-y-1 text-sm text-burgundy-dark/90">
          <li><span aria-hidden>🗓️ </span>{fmtDate(e.starts_at)}, {fmtWeekday(e.starts_at)}</li>
          <li><span aria-hidden>🕖 </span>{fmtTime(e.starts_at)} onwards</li>
          {routed ? (
            <li className="flex gap-1"><span aria-hidden>📍</span>
              <span>
                {e.route_start && <span className="block"><b>Start:</b> {e.route_start}</span>}
                {e.route_via && <span className="block"><b>Via:</b> {e.route_via}</span>}
                {e.route_end && <span className="block"><b>Destination:</b> {e.route_end}</span>}
              </span>
            </li>
          ) : e.location && <li><span aria-hidden>📍 </span>{e.location}</li>}
        </ul>
        {toText(e.description_te || e.description) && <p className="mt-3 line-clamp-3 font-telugu text-sm leading-relaxed text-burgundy-dark/80">{toText(e.description_te || e.description)}</p>}
        <Link href={`/events/${e.id}`} className="btn-royal mt-4 self-start !py-2">View Details →</Link>
      </div>
    </article>
  );
}
