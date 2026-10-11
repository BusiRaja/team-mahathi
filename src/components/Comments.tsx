"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { displayName, useAuth } from "@/lib/useSession";
import { supabase } from "@/lib/supabase";
import { fmtDate } from "@/lib/data";
import type { Comment } from "@/lib/types";
import { useLang } from "@/lib/i18n/client";

export default function Comments({ updateId }: { updateId: string }) {
  const { t, lang } = useLang();
  const { user, loading } = useAuth();
  const path = usePathname();
  const [list, setList] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [trap, setTrap] = useState(""); // honeypot: real visitors never fill this
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("comments").select("*").eq("update_id", updateId).eq("hidden", false).order("created_at", { ascending: false }).limit(100);
    setList((data ?? []) as Comment[]);
  }, [updateId]);
  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (trap) return;
    let last = 0; try { last = Number(localStorage.getItem("lastComment") ?? 0); } catch {}
    if (Date.now() - last < 20_000) { setState("error"); setMsg(t("comments.wait")); return; }
    if (!supabase) { setState("error"); setMsg(t("comments.needSupabase")); return; }
    if (!user) return;
    setState("busy");
    const { error } = await supabase.from("comments").insert({ update_id: updateId, user_id: user.id, name: displayName(user).slice(0, 60), body: body.trim() });
    if (error) { setState("error"); setMsg(t("comments.failed")); return; }
    try { localStorage.setItem("lastComment", String(Date.now())); } catch {}
    setBody(""); setState("idle"); setMsg(""); load();
  }

  return (
    <section id="comments" aria-labelledby="comments-h" className="border-t border-gold/20 pt-5">
      <h2 id="comments-h" className="font-display text-lg font-bold text-burgundy">{t("comments.title", { n: list.length })}</h2>
      {loading ? null : user ? (
        <form onSubmit={submit} className="mt-3 space-y-2">
          <p className="text-xs text-burgundy/70">{t("comments.postingAs", { name: displayName(user) })}</p>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} required maxLength={600} placeholder={t("comments.write")} aria-label={t("comments.write")} className="field min-h-20 font-telugu" />
          <input value={trap} onChange={(e) => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" name="website" />
          <div className="flex items-center gap-3">
            <button className="btn-royal" disabled={state === "busy"}>{state === "busy" ? t("comments.posting") : t("comments.post")}</button>
            {state === "error" && <span role="alert" className="text-sm text-red-700">{msg}</span>}
          </div>
        </form>
      ) : (
        <p className="mt-3 rounded-xl bg-blush/60 p-3 text-sm">
          {t("comments.loginPrompt")}{" "}
          <Link href={`/login?next=${encodeURIComponent(path)}`} className="font-semibold text-burgundy underline">{t("auth.login")}</Link>
          {" · "}
          <Link href={`/signup?next=${encodeURIComponent(path)}`} className="font-semibold text-burgundy underline">{t("auth.signup")}</Link>
        </p>
      )}
      <ul className="mt-4 space-y-3">
        {list.map((c) => (
          <li key={c.id} className="rounded-xl bg-blush/60 p-3 text-sm">
            <p className="font-semibold text-burgundy">{c.name} <span className="font-normal text-burgundy/60">· {fmtDate(c.created_at, lang)}</span></p>
            <p className="mt-1 whitespace-pre-line font-telugu">{c.body}</p>
          </li>
        ))}
      </ul>
      {!list.length && <p className="mt-3 text-sm text-burgundy/70">{t("comments.none")}</p>}
    </section>
  );
}
