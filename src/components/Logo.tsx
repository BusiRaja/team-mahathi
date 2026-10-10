/** Round crest. Drop your own file at /public/logo.png to replace it. */
export default function Logo({ size = 64 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/assets/images/logo.png"
      alt="Team Mahathi, Gajwel"
      width={size}
      height={size}
      className="rounded-full bg-white object-cover shadow-royal ring-2 ring-burgundy"
      style={{ width: size, height: size }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
    />
  );
}
