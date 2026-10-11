"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useAuth, displayName } from "@/lib/useSession";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/client";
import LangSwitch from "./LangSwitch";
import PushToggle from "./PushToggle";
import type { Key } from "@/lib/i18n";

const left = [
  { href: "/", key: "nav.home" as Key, icon: "🏠" },
  { href: "/albums", key: "nav.albums" as Key, icon: "📖" },
  { href: "/gallery", key: "nav.gallery" as Key, icon: "🖼️" },
];
const right = [
  { href: "/updates", key: "nav.updates" as Key, icon: "📣" },
  { href: "/events", key: "nav.events" as Key, icon: "🗓️" },
];

export default function Nav() {
  const path = usePathname();
  const { t } = useLang();
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const logout = async () => { await supabase?.auth.signOut(); router.replace("/"); router.refresh(); };
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const item = (l: { href: string; key: Key }) => (
    <Link
      key={l.href}
      href={l.href}
      aria-current={active(l.href) ? "page" : undefined}
      className={`relative px-2 py-5 text-[12px] font-medium uppercase tracking-wider lg:px-3 lg:text-[13px] xl:px-4 transition ${active(l.href) ? "text-burgundy" : "text-burgundy-dark/70 hover:text-burgundy"}`}
    >
      {t(l.key)}
      {active(l.href) && <span className="absolute inset-x-3 bottom-2 h-0.5 rounded bg-burgundy" />}
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gold/30 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="hidden shrink-0 items-center gap-2 md:flex xl:w-52">
            <span aria-hidden className="text-lg text-saffron-deep">📍</span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">{t("nav.city")}</div>
              <div className="text-[11px] text-burgundy/60">{t("nav.state")}</div>
            </div>
            <LangSwitch />
          </div>
          <div className="md:hidden"><Link href="/"><Logo size={60} /></Link></div>

          <nav aria-label="Main" className="hidden items-center md:flex">
            {left.map(item)}
            <Link href="/" className="relative z-10 mx-3 -mb-8 mt-4 block"><Logo size={100} /></Link>
            {right.map(item)}
          </nav>

          <div className="flex shrink-0 items-center justify-end gap-2 xl:w-52">
            <div className="md:hidden">
              <LangSwitch />
            </div>
            {!loading && !user && (
              <>
                <Link href="/login" className="whitespace-nowrap rounded-full border border-burgundy/40 px-3 py-1.5 text-xs font-semibold text-burgundy hover:bg-burgundy/5 sm:px-4 sm:py-2 sm:text-sm">{t("auth.login")}</Link>
                <Link href="/signup" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-burgundy px-3 py-1.5 text-xs font-semibold text-white shadow-royal hover:bg-burgundy-light sm:gap-2 sm:px-4 sm:py-2 sm:text-sm">
                  <span aria-hidden className="hidden lg:inline">👥</span><span>{t("nav.joinTeam")}</span>
                </Link>
              </>
            )}
            {!loading && user && (
              <>
                {isAdmin && <Link href="/admin" className="whitespace-nowrap rounded-full border border-gold/60 px-3 py-1.5 text-xs font-semibold text-burgundy hover:bg-gold/10 sm:text-sm">{t("auth.adminPanel")}</Link>}
                <span className="hidden max-w-[8rem] truncate text-sm font-medium text-burgundy lg:inline">{t("auth.hello", { name: displayName(user) })}</span>
                <PushToggle />
                <button onClick={logout} className="whitespace-nowrap rounded-full border border-burgundy/40 px-3 py-1.5 text-xs font-semibold text-burgundy hover:bg-burgundy/5 sm:px-4 sm:py-2 sm:text-sm">{t("auth.logout")}</button>
              </>
            )}
          </div>
        </div>
      </header>

      <nav aria-label="Main" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-gold/40 bg-white/95 backdrop-blur md:hidden">
        <ul className="mx-auto flex max-w-md items-stretch justify-around">
          {[...left, ...right.slice(0, 2)].map((l) => (
            <li key={l.href} className="flex-1">
              <Link href={l.href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active(l.href) ? "text-burgundy" : "text-burgundy/50"}`}>
                <span className="text-lg">{l.icon}</span>
                {t(l.key)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
