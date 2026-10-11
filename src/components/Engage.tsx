"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/useSession";
import { supabase } from "@/lib/supabase";
import { compact } from "@/lib/updates-meta";
import { useLang } from "@/lib/i18n/client";

const bumpView = (id: string) => supabase?.rpc("bump_update", { p_id: id, p_field: "views" });

/** Counts a view once per browser session. Likes belong to the signed-in user (one per update, can be undone). Also renders share buttons. */
export default function Engage({ id, views = 0, likes = 0, comments = 0, title }: { id: string; views?: number; likes?: number; comments?: number; title: string }) {
  const { t } = useLang();
  const { user } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const uid = user?.id;
  const [v, setV] = useState(views);
  const [l, setL] = useState(likes);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(`seen:${id}`)) { sessionStorage.setItem(`seen:${id}`, "1"); bumpView(id); setV((x) => x + 1); }
    } catch { /* storage blocked: skip counting */ }
  }, [id]);

  // Whether the signed-in user already liked this update.
  useEffect(() => {
    if (!supabase || !uid) { setLiked(false); return; }
    let live = true;
    supabase.from("update_likes").select("update_id").eq("update_id", id).eq("user_id", uid).maybeSingle().then(({ data }) => { if (live) setLiked(Boolean(data)); });
    return () => { live = false; };
  }, [id, uid]);

  async function like() {
    if (!user || !supabase) { router.push(`/login?next=${encodeURIComponent(path)}`); return; }
    const was = liked;
    setLiked(!was); setL((x) => Math.max(0, x + (was ? -1 : 1))); // optimistic
    const { error } = was
      ? await supabase.from("update_likes").delete().eq("update_id", id).eq("user_id", user.id)
      : await supabase.from("update_likes").insert({ update_id: id, user_id: user.id });
    if (error && error.code !== "23505") { setLiked(was); setL((x) => Math.max(0, x + (was ? 1 : -1))); }
  }
  const url = () => (typeof window === "undefined" ? "" : window.location.href);
  const enc = encodeURIComponent;
  const copy = async () => { await navigator.clipboard?.writeText(url()); setCopied(true); setTimeout(() => setCopied(false), 1800); };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gold/20 pt-4 text-sm">
      <div className="flex items-center gap-5 text-burgundy">
        <span>👁 {compact(v)} {t("engage.views")}</span>
        <button onClick={like} aria-pressed={liked} title={user ? undefined : t("engage.loginToLike")} className={`font-medium ${liked ? "text-burgundy" : "text-burgundy/70"}`}>{liked ? "♥" : "♡"} {compact(l)} {t("engage.likes")}</button>
        <a href="#comments" className="text-burgundy/70">💬 {compact(comments)} {t("engage.comments")}</a>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-burgundy/70">{t("engage.share")}</span>
        <a aria-label={t("engage.whatsapp")} target="_blank" rel="noreferrer" onClick={(e) => { e.currentTarget.href = `https://wa.me/?text=${enc(title + " " + url())}`; }} href="#" className="grid h-8 w-8 place-items-center rounded-full bg-green-500 text-xs font-bold text-white">W</a>
        <a aria-label={t("engage.facebook")} target="_blank" rel="noreferrer" onClick={(e) => { e.currentTarget.href = `https://www.facebook.com/sharer/sharer.php?u=${enc(url())}`; }} href="#" className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">f</a>
        <button aria-label={t("engage.copyLink")} onClick={copy} className="grid h-8 w-8 place-items-center rounded-full border border-burgundy/40 text-burgundy">🔗</button>
        {copied && <span role="status" className="text-xs text-burgundy">{t("engage.copied")}</span>}
      </div>
    </div>
  );
}
