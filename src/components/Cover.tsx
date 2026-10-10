import { optimize } from "@/lib/cloudinary-client";

/** Image with a burgundy fallback so cards look right before any photos are uploaded. */
export default function Cover({ src, glyph = "🪔", className = "", width = 700 }: { src?: string | null; glyph?: string; className?: string; width?: number }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-burgundy-light via-burgundy to-burgundy-dark ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={optimize(src, width)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span aria-hidden className="absolute inset-0 grid place-items-center text-5xl text-gold-light/60">{glyph}</span>
      )}
    </div>
  );
}
