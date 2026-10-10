import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import PageHero from "@/components/PageHero";
import { getAlbumByYear, getMedia, getSettings } from "@/lib/data";
import { getT } from "@/lib/i18n/server";
import { albumDescription, albumTitle, localSettings } from "@/lib/i18n/content";

export default async function AlbumPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const { t, lang } = await getT();
  const album = await getAlbumByYear(Number(year));
  if (!album) notFound();
  const [media, s] = await Promise.all([getMedia({ albumId: album.id }), getSettings()]);
  const L = localSettings(s, lang);
  return (
    <>
      <PageHero title={String(album.year)} kicker={albumTitle(album, lang).toUpperCase()} sub={albumDescription(album, lang) || L.headline} image={s.hero_image} />
      <div className="wrap py-6">
        <Link href="/albums" className="text-sm font-medium text-burgundy">{t("albums.back")}</Link>
        <div className="mt-4"><Gallery items={media} /></div>
      </div>
    </>
  );
}
