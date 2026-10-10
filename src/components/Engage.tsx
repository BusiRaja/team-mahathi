"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { compact } from "./UpdateCard";

const bump = (id: string, field: "views" | "likes") => supabase?.rpc("bump_update", { p_id: id, p_field: field });

/** Counts a view once per browser session and lets a visitor like once. Also renders share buttons. */
export default function Engage({ id, views = 0, likes = 0, comments = 0, title }: { id: string; views?: number; likes?: number; comments?: number; title: string }) {
  const [v, setV] = useState(views);
  const [l, setL] = useState(likes);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      setLiked(localStorage.getItem(`liked:${id}`) === "1");
      if (!sessionStorage.getItem(`seen:${id}`)) { sessionStorage.setItem(`seen:${id}`, "1"); bump(id, "views"); setV((x) => x + 1); }
    } catch { /* storage blocked: skip counting */ }
  }, [id]);

  function like() {
    if (liked) return;
    setLiked(true); setL((x) => x + 1); bump(id, "likes");
    try { localStorage.setItem(`liked:${id}`, "1"); } catch {}
  }
  const url = () => (typeof window === "undefined" ? "" : window.location.href);
  const enc = encodeURIComponent;
  const copy = async () => { await navigator.clipboard?.writeText(url()); setCopied(true); setTimeout(() => setCopied(false), 1800); };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gold/20 pt-4 text-sm">
      <div className="flex items-center gap-5 text-burgundy">
        <span>👁 {compact(v)} Views</span>
        <button onClick={like} aria-pressed={liked} className={`font-medium ${liked ? "text-burgundy" : "text-burgundy/70"}`}>{liked ? "♥" : "♡"} {compact(l)} Likes</button>
        <a href="#comments" className="text-burgundy/70">💬 {compact(comments)} Comments</a>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-burgundy/70">Share this update:</span>
        <a aria-label="Share on WhatsApp" target="_blank" rel="noreferrer" onClick={(e) => { e.currentTarget.href = `https://wa.me/?text=${enc(title + " " + url())}`; }} href="#" className="grid h-8 w-8 place-items-center rounded-full bg-green-500 text-xs font-bold text-white">W</a>
        <a aria-label="Share on Facebook" target="_blank" rel="noreferrer" onClick={(e) => { e.currentTarget.href = `https://www.facebook.com/sharer/sharer.php?u=${enc(url())}`; }} href="#" className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">f</a>
        <button aria-label="Copy link" onClick={copy} className="grid h-8 w-8 place-items-center rounded-full border border-burgundy/40 text-burgundy">🔗</button>
        {copied && <span role="status" className="text-xs text-burgundy">Link copied</span>}
      </div>
    </div>
  );
}
