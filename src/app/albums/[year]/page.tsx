import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import Cover from "@/components/Cover";
import { getAlbumsByYear, getMedia, getSettings } from "@/lib/data";
import { getT } from "@/lib/i18n/server";
import { albumDescription, albumTitle, localSettings } from "@/lib/i18n/content";

/** All albums of one year. A year with a single album goes straight to it, so older links keep working. */
export default async function YearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const y = Number(year);
  if (!Number.isInteger(y)) notFound();
  const { t, lang } = await getT();
  const albums = await getAlbumsByYear(y);
  if (!albums.length) notFound();
  if (albums.length === 1) redirect(`/albums/${y}/${albums[0].id}`);
  const [media, s] = await Promise.all([getMedia(), getSettings()]);
  const L = localSettings(s, lang);
  const countBy = (id: string) => media.filter((m) => m.album_id === id).length;
  const coverFor = (id: string, cover: string | null) => cover ?? media.find((m) => m.album_id === id && m.type === "photo")?.url ?? null;
  return (
    <>
      <PageHero title={String(y)} kicker={t("albums.count", { n: albums.length }).toUpperCase()} sub={L.headline} image={s.hero_image} />
      <div className="wrap py-6">
        <Link href="/albums" className="text-sm font-medium text-burgundy">{t("albums.back")}</Link>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {albums.map((a) => (
            <Link key={a.id} href={`/albums/${y}/${a.id}`} className="group relative block overflow-hidden rounded-2xl shadow-royal">
              <Cover src={coverFor(a.id, a.cover_url)} className="aspect-[4/5] transition duration-500 group-hover:scale-105" width={600} />
              <div className="absolute inset-0 bg-gradient-to-t from-burgundy-dark/90 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-ivory">
                <div className="font-telugu text-lg font-bold leading-snug text-white">{albumTitle(a, lang)}</div>
                {albumDescription(a, lang) && <div className="line-clamp-1 text-xs text-ivory/80">{albumDescription(a, lang)}</div>}
                <div className="text-xs text-gold-light">{t("albums.items", { n: countBy(a.id) })}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
