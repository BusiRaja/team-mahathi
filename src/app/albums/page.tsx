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
  const years = [...new Set(albums.map((a) => a.year))]; // already newest year first
  return (
    <>
      <PageHero title={t("albums.title")} kicker={t("hero.albums.kicker")} sub={L.headline} image={s.hero_image} />
      <div className="wrap space-y-10 py-8">
        {years.map((y) => {
          const inYear = albums.filter((a) => a.year === y);
          return (
            <section key={y} aria-labelledby={`year-${y}`}>
              <div className="mb-3 flex items-end justify-between border-b border-gold/30 pb-2">
                <h2 id={`year-${y}`} className="font-display text-3xl font-black text-burgundy">{y}</h2>
                <span className="text-sm text-burgundy/70">{t("albums.count", { n: inYear.length })}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {inYear.map((a) => (
                  <Link key={a.id} href={`/albums/${a.year}/${a.id}`} className="group relative block overflow-hidden rounded-2xl shadow-royal">
                    <Cover src={coverFor(a.id, a.cover_url)} className="aspect-[4/5] transition duration-500 group-hover:scale-105" width={600} />
                    <div className="absolute inset-0 bg-gradient-to-t from-burgundy-dark/90 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-ivory"><div className="font-telugu text-lg font-bold leading-snug text-white">{albumTitle(a, lang)}</div><div className="text-xs text-gold-light">{t("albums.items", { n: countBy(a.id) })}</div></div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
        {!albums.length && <p className="royal-card mt-4 p-8 text-center">{t("albums.none")}</p>}
      </div>
    </>
  );
}
