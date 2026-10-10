import PageHero from "@/components/PageHero";
import EventsExplorer from "@/components/EventsExplorer";
import { getEvents, getSettings } from "@/lib/data";

export const revalidate = 30;

export default async function EventsPage() {
  const [events, s] = await Promise.all([getEvents(), getSettings()]);
  return (
    <>
      <PageHero title="Events" kicker="FESTIVALS • TRADITION • TOGETHER" telugu={s.tagline_te} script={s.hero_script.split(", ")} image={s.hero_image} />
      <EventsExplorer events={events} />
    </>
  );
}
