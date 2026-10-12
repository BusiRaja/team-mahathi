import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import PageHero from "@/components/PageHero";
import { getAlbumById, getAlbumsByYear, getMedia, getSettings } from "@/lib/data";
import { getT } from "@/lib/i18n/server";
import { albumDescription, albumTitle, localSettings } from "@/lib/i18n/content";

export default async function AlbumPage({ params }: { params: Promise<{ year: string; albumId: string }> }) {
  const { year, albumId } = await params;
  const { t, lang } = await getT();
  const album = await getAlbumById(albumId);
  if (!album || String(album.year) !== year) notFound();
  const [media, s, sameYear] = await Promise.all([getMedia({ albumId: album.id }), getSettings(), getAlbumsByYear(album.year)]);
  const L = localSettings(s, lang);
  const multiple = sameYear.length > 1;
  return (
    <>
      <PageHero title={String(album.year)} kicker={albumTitle(album, lang).toUpperCase()} sub={albumDescription(album, lang) || L.headline} image={s.hero_image} />
      <div className="wrap py-6">
        <Link href={multiple ? `/albums/${album.year}` : "/albums"} className="text-sm font-medium text-burgundy">
          {multiple ? t("albums.backYear", { year: album.year }) : t("albums.back")}
        </Link>
        <div className="mt-4"><Gallery items={media} /></div>
      </div>
    </>
  );
}
