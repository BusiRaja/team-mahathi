import Link from "next/link";
import PageHero from "@/components/PageHero";
import Cover from "@/components/Cover";
import { getAlbums, getMedia, getSettings } from "@/lib/data";
import { getT } from "@/lib/i18n/server";
import { albumTitle, localSettings } from "@/lib/i18n/content";

export default async function AlbumsPage() {
  const { t, lang } = await getT();
  const [albums, media, s] = await Promise.all([getAlbums(), getMedia(), getSettings()]);
  const L = localSettings(s, lang);
  const countBy = (id: string) => media.filter((m) => m.album_id === id).length;
  const coverFor = (id: string, cover: string | null) => cover ?? media.find((m) => m.album_id === id && m.type === "photo")?.url ?? null;
  return (
    <>
      <PageHero title={t("albums.title")} kicker={t("hero.albums.kicker")} sub={L.headline} image={s.hero_image} />
      <div className="wrap py-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {albums.map((a) => (
            <Link key={a.id} href={`/albums/${a.year}`} className="group relative block overflow-hidden rounded-2xl shadow-royal">
              <Cover src={coverFor(a.id, a.cover_url)} className="aspect-[4/5] transition duration-500 group-hover:scale-105" width={600} />
              <div className="absolute inset-0 bg-gradient-to-t from-burgundy-dark/90 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-ivory"><div className="font-display text-4xl font-black text-white">{a.year}</div><div className="text-sm">{albumTitle(a, lang)}</div><div className="text-xs text-gold-light">{t("albums.items", { n: countBy(a.id) })}</div></div>
            </Link>
          ))}
        </div>
        {!albums.length && <p className="royal-card mt-4 p-8 text-center">{t("albums.none")}</p>}
      </div>
    </>
  );
}
