import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { fmtDate, fmtTime } from "./data";
import { eventDescription, eventTitle, eventWhere, updateBody, updateTitle } from "./i18n/content";
import { toText } from "./text";
import type { Lang } from "./i18n";
import type { FestEvent, FestUpdate } from "./types";

export interface NotifyResult {
  status: "sent" | "already-notified" | "not-found";
  recipients: number;
  emails: { sent: number; error?: string };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

function admin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

interface Msg { kind: "event" | "update"; title: Record<Lang, string>; body: Record<Lang, string>; when: Record<Lang, string>; path: string }

function buildMessage(kind: "event" | "update", row: FestEvent | FestUpdate): Msg {
  const langs: Lang[] = ["en", "te"];
  const rec = <T,>(f: (l: Lang) => T) => ({ en: f("en"), te: f("te") }) as Record<Lang, T>;
  if (kind === "event") {
    const e = row as FestEvent;
    return {
      kind, path: `/events/${e.id}`,
      title: rec((l) => eventTitle(e, l)),
      body: rec((l) => clip(toText(eventDescription(e, l)), 160)),
      when: rec((l) => [fmtDate(e.starts_at, l), fmtTime(e.starts_at, l), eventWhere(e, l)].filter(Boolean).join(" · ")),
    };
  }
  const u = row as FestUpdate;
  void langs;
  return { kind, path: `/updates/${u.id}`, title: rec((l) => updateTitle(u, l)), body: rec((l) => clip(toText(updateBody(u, l)), 160)), when: rec((l) => fmtDate(u.created_at, l)) };
}

/** Bilingual (English + Telugu) so one email works for every member. */
function emailHtml(m: Msg, url: string, site: string) {
  const sameTitle = m.title.en === m.title.te;
  const block = (l: Lang) => `
    <h2 style="margin:0 0 6px;font:700 20px/1.3 Arial,sans-serif;color:#6B0F1A">${esc(m.title[l])}</h2>
    ${m.when[l] ? `<p style="margin:0 0 8px;font:14px/1.5 Arial,sans-serif;color:#8a5a5a">${esc(m.when[l])}</p>` : ""}
    ${m.body[l] ? `<p style="margin:0;font:15px/1.6 Arial,sans-serif;color:#3a1a1a">${esc(m.body[l])}</p>` : ""}`;
  return `<!doctype html><html><body style="margin:0;background:#FFFBF7;padding:24px">
  <table role="presentation" width="100%" style="max-width:560px;margin:auto;background:#fff;border:1px solid #e8d9a8;border-radius:16px"><tr><td style="padding:24px">
    <p style="margin:0 0 12px;font:700 12px Arial,sans-serif;letter-spacing:2px;color:#E67E00">${m.kind === "event" ? "NEW EVENT · కొత్త కార్యక్రమం" : "NEW UPDATE · కొత్త అప్‌డేట్"}</p>
    ${block("en")}
    ${sameTitle && m.body.en === m.body.te ? "" : `<hr style="border:0;border-top:1px solid #f0e6c8;margin:18px 0">${block("te")}`}
    <p style="margin:22px 0 0"><a href="${esc(url)}" style="display:inline-block;background:#6B0F1A;color:#fff;text-decoration:none;font:600 14px Arial,sans-serif;padding:12px 22px;border-radius:999px">View · చూడండి →</a></p>
  </td></tr></table>
  <p style="text-align:center;font:12px Arial,sans-serif;color:#999;margin:14px 0 0">You are receiving this because you have an account or subscription at ${esc(site)}.</p>
  </body></html>`;
}

async function sendEmails(emails: string[], m: Msg, url: string, site: string) {
  const key = process.env.BREVO_API_KEY, from = process.env.NOTIFY_FROM_EMAIL;
  if (!key || !from) return { sent: 0, error: "Email not configured (set BREVO_API_KEY and NOTIFY_FROM_EMAIL)" };
  if (!emails.length) return { sent: 0 };
  const subject = `${m.kind === "event" ? "New event" : "New update"}: ${m.title.en}${m.title.te && m.title.te !== m.title.en ? ` | ${m.title.te}` : ""}`;
  let sent = 0, error: string | undefined;
  for (let i = 0; i < emails.length; i += 500) {
    const chunk = emails.slice(i, i + 500);
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { email: from, name: process.env.NOTIFY_FROM_NAME || "Team Mahathi" },
        subject,
        htmlContent: emailHtml(m, url, site),
        // One version per recipient so nobody sees anyone else's address.
        messageVersions: chunk.map((email) => ({ to: [{ email }] })),
      }),
    });
    if (res.ok) sent += chunk.length;
    else error = `Brevo ${res.status}: ${(await res.text()).slice(0, 200)}`;
  }
  return { sent, error };
}


/** Emails every registered user and subscriber, and pushes to every enabled device. Runs once per post. */
export async function notifyPublished(kind: "event" | "update", id: string, origin: string): Promise<NotifyResult> {
  const sb = admin();
  if (!sb) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  const table = kind === "event" ? "events" : "updates";
  const { data: row } = await sb.from(table).select("*").eq("id", id).maybeSingle();
  const none = { sent: 0 };
  if (!row) return { status: "not-found", recipients: 0, emails: none };
  if ((row as { notified_at?: string | null }).notified_at) return { status: "already-notified", recipients: 0, emails: none, push: { sent: 0, removed: 0 } };

  // Claim the post first so two quick clicks can't announce it twice.
  const { data: claimed } = await sb.from(table).update({ notified_at: new Date().toISOString() }).eq("id", id).is("notified_at", null).select("id");
  if (!claimed?.length) return { status: "already-notified", recipients: 0, emails: none, push: { sent: 0, removed: 0 } };

  const [{ data: profiles }, { data: subs }] = await Promise.all([sb.from("profiles").select("email"), sb.from("subscribers").select("email")]);
  const emails = [...new Set([...(profiles ?? []), ...(subs ?? [])].map((r: { email: string | null }) => (r.email ?? "").trim().toLowerCase()).filter((e) => /^\S+@\S+\.\S+$/.test(e)))];

  const msg = buildMessage(kind, row as FestEvent | FestUpdate);
  const url = origin + msg.path;
  const em = await sendEmails(emails, msg, url, new URL(origin).host).catch((e) => ({ sent: 0, error: String(e.message ?? e) }))
  return { status: "sent", recipients: emails.length, emails: em };
}
