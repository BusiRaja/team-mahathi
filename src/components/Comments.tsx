"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fmtDate } from "@/lib/data";
import type { Comment } from "@/lib/types";
import { useLang } from "@/lib/i18n/client";

export default function Comments({ updateId }: { updateId: string }) {
  const { t, lang } = useLang();
  const [list, setList] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [trap, setTrap] = useState(""); // honeypot: real visitors never fill this
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("comments").select("*").eq("update_id", updateId).eq("hidden", false).order("created_at", { ascending: false }).limit(100);
    setList((data ?? []) as Comment[]);
  }, [updateId]);
  useEffect(() => { try { setName(localStorage.getItem("commenter") ?? ""); } catch {} load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (trap) return;
    let last = 0; try { last = Number(localStorage.getItem("lastComment") ?? 0); } catch {}
    if (Date.now() - last < 20_000) { setState("error"); setMsg(t("comments.wait")); return; }
    if (!supabase) { setState("error"); setMsg(t("comments.needSupabase")); return; }
    setState("busy");
    const { error } = await supabase.from("comments").insert({ update_id: updateId, name: name.trim(), body: body.trim() });
    if (error) { setState("error"); setMsg(t("comments.failed")); return; }
    try { localStorage.setItem("commenter", name.trim()); localStorage.setItem("lastComment", String(Date.now())); } catch {}
    setBody(""); setState("idle"); setMsg(""); load();
  }

  return (
    <section id="comments" aria-labelledby="comments-h" className="border-t border-gold/20 pt-5">
      <h2 id="comments-h" className="font-display text-lg font-bold text-burgundy">{t("comments.title", { n: list.length })}</h2>
      <form onSubmit={submit} className="mt-3 space-y-2">
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder={t("comments.name")} aria-label={t("comments.name")} className="field sm:!w-64" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} required maxLength={600} placeholder={t("comments.write")} aria-label={t("comments.write")} className="field min-h-20 font-telugu" />
        <input value={trap} onChange={(e) => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" name="website" />
        <div className="flex items-center gap-3">
          <button className="btn-royal" disabled={state === "busy"}>{state === "busy" ? t("comments.posting") : t("comments.post")}</button>
          {state === "error" && <span role="alert" className="text-sm text-red-700">{msg}</span>}
        </div>
      </form>
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
