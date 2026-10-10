import Link from "next/link";
import PageHero from "@/components/PageHero";
import UpdatesFeed from "@/components/UpdatesFeed";
import Subscribe from "@/components/Subscribe";
import Cover from "@/components/Cover";
import { QuickLinks } from "@/components/EventsExplorer";
import { getT } from "@/lib/i18n/server";
import { eventTitle, eventRoute, eventLocation, localSettings } from "@/lib/i18n/content";
import { dayNum, fmtTime, getEvents, getSettings, getUpdates, monthShort } from "@/lib/data";

export default async function UpdatesPage() {
  const { t, lang } = await getT();
  const [updates, events, s] = await Promise.all([getUpdates(), getEvents(), getSettings()]);
  const L = localSettings(s, lang);
  const next = events.find((e) => new Date(e.starts_at).getTime() > Date.now());
  return (
    <>
      <PageHero title={t("updates.title")} kicker={t("hero.updates.kicker")} sub={L.headline} script={t("hero.updates.script").split("|")} image={s.hero_image} />
      <div className="wrap grid gap-8 py-6 lg:grid-cols-[1fr_300px]">
        <UpdatesFeed updates={updates} />
        <aside className="space-y-5 lg:mt-14">
          {next && (
            <div className="royal-card p-4">
              <div className="flex items-end justify-between"><h2 className="font-display text-lg font-bold text-burgundy">{t("home.upcoming")}</h2><Link href="/events" className="text-sm text-burgundy">{t("updates.viewAll")}</Link></div>
              <div className="relative mt-3"><Cover src={next.cover_url} className="h-24 rounded-lg" width={400} /><span className="absolute left-2 top-2 rounded bg-white px-2 py-1 text-center font-display text-lg font-bold leading-none text-burgundy">{dayNum(next.starts_at)}<small className="block text-[9px]">{monthShort(next.starts_at, lang)}</small></span></div>
              <h3 className="mt-3 font-telugu font-bold text-burgundy">{eventTitle(next, lang)}</h3>
              <p className="text-sm text-burgundy/70">🕖 {t("events.onwards", { time: fmtTime(next.starts_at, lang) })}<br />📍 {eventRoute(next, lang).start || eventLocation(next, lang)}</p>
              <Link href={`/events/${next.id}`} className="btn-royal mt-3 w-full">{t("updates.viewEvent")}</Link>
            </div>
          )}
          <QuickLinks items={[{ href: "/events", label: "quick.calendar", icon: "🗓️" }, { href: "/gallery", label: "quick.photos", icon: "🖼️" }, { href: "/gallery", label: "quick.videos", icon: "▶" }, { href: "/updates", label: "quick.announcements", icon: "📣" }]} />
        </aside>
      </div>
      <Subscribe />
    </>
  );
}
