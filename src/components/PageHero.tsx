import RichText from "@/components/RichText";

export default function PageHero({
  title, kicker, telugu, script, image, children,
}: { title: string; kicker?: string; telugu?: string; script?: string[]; image?: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#3a0710] via-burgundy-dark to-burgundy text-ivory">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute inset-y-0 right-0 h-full w-3/5 object-cover object-top opacity-90 [mask-image:linear-gradient(to_right,transparent,black_45%)]" />
      )}
      {!image && <div aria-hidden className="absolute -right-10 top-1/2 -translate-y-1/2 text-[14rem] leading-none text-gold/15">🔱</div>}
      <div className="wrap relative flex min-h-[150px] items-center justify-between gap-6 py-8 md:min-h-[190px]">
        <div>
          <h1 className="font-display text-4xl font-bold text-white md:text-6xl">{title}</h1>
          {kicker && <p className="mt-1 text-xs tracking-[0.35em] text-gold-light md:text-sm">{kicker}</p>}
          {telugu && <RichText html={telugu} className="mt-2 font-serif text-lg text-white" />}
          {children}
        </div>
        {script && (
          <p className="script-text hidden -rotate-6 text-right text-2xl leading-tight text-white/95 md:block md:text-3xl">
            {script.map((l) => <span key={l} className="block">{l}</span>)}
          </p>
        )}
      </div>
    </section>
  );
}
