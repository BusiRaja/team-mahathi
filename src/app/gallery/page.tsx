import Gallery from "@/components/Gallery";
import PageHero from "@/components/PageHero";
import { getMedia, getSettings } from "@/lib/data";
import { getT } from "@/lib/i18n/server";

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ deity?: string }> }) {
  const { deity } = await searchParams;
  const { t } = await getT();
  const [media, s] = await Promise.all([getMedia(), getSettings()]);
  const initial = deity === "ganesha" || deity === "durga" ? deity : "all";
  return (
    <>
      <PageHero title={t("gallery.title")} kicker={t("hero.gallery.kicker")} sub={t("hero.gallery.sub")} image={s.hero_image} />
      <div className="wrap py-6"><Gallery items={media} initialDeity={initial} /></div>
    </>
  );
}
