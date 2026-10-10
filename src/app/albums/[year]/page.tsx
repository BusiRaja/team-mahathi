import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import PageHero from "@/components/PageHero";
import { getAlbumByYear, getMedia, getSettings } from "@/lib/data";

export const revalidate = 30;

export default async function AlbumPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const album = await getAlbumByYear(Number(year));
  if (!album) notFound();
  const [media, s] = await Promise.all([getMedia({ albumId: album.id }), getSettings()]);
  return (
    <>
      <PageHero title={String(album.year)} kicker={album.title.toUpperCase()} telugu={s.tagline_te} image={s.hero_image} />
      <div className="wrap py-6">
        <Link href="/albums" className="text-sm font-medium text-burgundy">← All albums</Link>
        <div className="mt-4"><Gallery items={media} /></div>
      </div>
    </>
  );
}
