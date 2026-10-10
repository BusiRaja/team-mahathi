"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useSignedIn } from "@/lib/useSession";

const left = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/albums", label: "Albums", icon: "📖" },
  { href: "/gallery", label: "Gallery", icon: "🖼️" },
];
const right = [
  { href: "/updates", label: "Updates", icon: "📣" },
  { href: "/events", label: "Events", icon: "🗓️" },
  { href: "/admin", label: "Admin", icon: "🔐" },
];

export default function Nav({ joinUrl }: { joinUrl: string }) {
  const path = usePathname();
  const signedIn = useSignedIn();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const item = (l: { href: string; label: string }) => (
    <Link
      key={l.href}
      href={l.href}
      aria-current={active(l.href) ? "page" : undefined}
      className={`relative px-4 py-5 text-[13px] font-medium uppercase tracking-wider transition ${active(l.href) ? "text-burgundy" : "text-burgundy-dark/70 hover:text-burgundy"}`}
    >
      {l.label}
      {active(l.href) && <span className="absolute inset-x-3 bottom-2 h-0.5 rounded bg-burgundy" />}
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gold/30 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 max-md:flex-row-reverse">
          <div className="md:w-40 items-center gap-2 flex">
            <span aria-hidden className="text-lg text-saffron-deep">📍</span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Gajwel</div>
              <div className="text-[11px] text-burgundy/60">Telangana</div>
            </div>
          </div>
          <div className="md:hidden"><Link href="/"><Logo size={44} /></Link></div>

          <nav aria-label="Main" className="hidden items-center justify-center md:flex flex-1">
            {left.map(item)}
            <Link href="/" className="relative z-10 mx-3 -mb-8 mt-4 block"><Logo size={76} /></Link>
            {right.map(item)}
          </nav>

          {/*signedIn === false ? (
  <Link href={joinUrl} className="inline-flex items-center gap-2 rounded-full bg-burgundy px-4 py-2 text-sm font-semibold text-white shadow-royal hover:bg-burgundy-light">
            <span aria-hidden>👥</span> Join Team
          </Link>
          ) : <span className="w-24" aria-hidden />*/}
        </div>
      </header>

      <nav aria-label="Main" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-gold/40 bg-white/95 backdrop-blur md:hidden">
        <ul className="mx-auto flex max-w-md items-stretch justify-around">
          {[...left, ...right.slice(0, 2)].map((l) => (
            <li key={l.href} className="flex-1">
              <Link href={l.href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active(l.href) ? "text-burgundy" : "text-burgundy/50"}`}>
                <span className="text-lg">{l.icon}</span>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
