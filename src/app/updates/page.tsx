import Link from "next/link";
import PageHero from "@/components/PageHero";
import UpdatesFeed from "@/components/UpdatesFeed";
import Subscribe from "@/components/Subscribe";
import Cover from "@/components/Cover";
import { QuickLinks } from "@/components/EventsExplorer";
import { dayNum, fmtTime, getEvents, getSettings, getUpdates, monthShort } from "@/lib/data";

export const revalidate = 30;

export default async function UpdatesPage() {
  const [updates, events, s] = await Promise.all([getUpdates(), getEvents(), getSettings()]);
  const next = events.find((e) => new Date(e.starts_at).getTime() > Date.now());
  return (
    <>
      <PageHero title="Updates" kicker="STAY CONNECTED • STAY INSPIRED" telugu={s.tagline_te} script={["People", "Events", "Memories", "Announcements"]} image={s.hero_image} />
      <div className="wrap grid gap-8 py-6 lg:grid-cols-[1fr_300px]">
        <UpdatesFeed updates={updates} />
        <aside className="space-y-5 lg:mt-14">
          {next && (
            <div className="royal-card p-4">
              <div className="flex items-end justify-between"><h2 className="font-display text-lg font-bold text-burgundy">Upcoming Events</h2><Link href="/events" className="text-sm text-burgundy">View all →</Link></div>
              <div className="relative mt-3"><Cover src={next.cover_url} className="h-24 rounded-lg" width={400} /><span className="absolute left-2 top-2 rounded bg-white px-2 py-1 text-center font-display text-lg font-bold leading-none text-burgundy">{dayNum(next.starts_at)}<small className="block text-[9px]">{monthShort(next.starts_at)}</small></span></div>
              <h3 className="mt-3 font-telugu font-bold text-burgundy">{next.title_te || next.title}</h3>
              <p className="text-sm text-burgundy/70">🕖 {fmtTime(next.starts_at)} onwards<br />📍 {next.route_start ?? next.location}</p>
              <Link href={`/events/${next.id}`} className="btn-royal mt-3 w-full">View Event</Link>
            </div>
          )}
          <QuickLinks items={[{ href: "/events", label: "Event Calendar", icon: "🗓️" }, { href: "/gallery", label: "Photo Gallery", icon: "🖼️" }, { href: "/gallery", label: "Video Gallery", icon: "▶" }, { href: "/updates", label: "Announcements", icon: "📣" }]} />
        </aside>
      </div>
      <Subscribe />
    </>
  );
}
