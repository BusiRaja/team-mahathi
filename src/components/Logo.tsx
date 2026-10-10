 
export default function Logo({ size = 128 }: { size?: number }) {
  return ( 
    <img
      src="/assets/images/logo.png"
      alt="Team Mahathi, Gajwel"
      width={size}
      height={size}
      className="rounded-full bg-white object-cover shadow-royal"
      style={{ width: size, height: size }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
    />
  );
}
