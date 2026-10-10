import PageHero from "@/components/PageHero";
import EventsExplorer from "@/components/EventsExplorer";
import { getEvents, getSettings } from "@/lib/data";
import { getT } from "@/lib/i18n/server";
import { localSettings } from "@/lib/i18n/content";

export default async function EventsPage() {
  const { t, lang } = await getT();
  const [events, s] = await Promise.all([getEvents(), getSettings()]);
  const L = localSettings(s, lang);
  return (
    <>
      <PageHero title={t("events.title")} kicker={t("hero.events.kicker")} sub={L.headline} script={L.heroScript.split(", ")} image={s.hero_image} />
      <EventsExplorer events={events} />
    </>
  );
}
