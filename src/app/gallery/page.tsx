import Gallery from "@/components/Gallery";
import PageHero from "@/components/PageHero";
import { getMedia, getSettings } from "@/lib/data";

export const revalidate = 30;

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ deity?: string }> }) {
  const { deity } = await searchParams;
  const [media, s] = await Promise.all([getMedia(), getSettings()]);
  const initial = deity === "ganesha" || deity === "durga" ? deity : "all";
  return (
    <>
      <PageHero title="Gallery" kicker="PHOTOS • VIDEOS • MEMORIES" telugu="Tap any memory to view full screen, swipe, save or share." image={s.hero_image} />
      <div className="wrap py-6"><Gallery items={media} initialDeity={initial} /></div>
    </>
  );
}
