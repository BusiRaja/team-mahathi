"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isConfigured, supabase } from "@/lib/supabase";
import RichEditor from "@/components/RichEditor";
import { isEmptyRich } from "@/lib/text";
import { deleteFromCloudinary, uploadToCloudinary } from "@/lib/cloudinary-client";
import {
  CATEGORIES, DEITIES, UPDATE_KINDS,
  type Album, type Comment, type FestEvent, type FestUpdate, type Media, type Settings,
} from "@/lib/types";

type Tab = "media" | "albums" | "updates" | "events" | "comments" | "settings";

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session) { setIsAdmin(null); return; }
    supabase.from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(Boolean(data)));
  }, [session]);

  if (!isConfigured) {
    return (
      <div className="royal-card mx-auto mt-8 max-w-lg p-6 text-center">
        <h1 className="section-title">Admin</h1>
        <p className="mt-2 font-serif text-lg">Add your Supabase URL and anon key to <code>.env.local</code>, run <code>supabase/schema.sql</code>, then restart the app.</p>
      </div>
    );
  }
  if (!ready) return <p className="p-8 text-center">Loading…</p>;
  if (!session) return <Login />;
  if (isAdmin === null) return <p className="p-8 text-center">Checking access…</p>;
  if (!isAdmin) {
    return (
      <div className="royal-card mx-auto mt-8 max-w-lg p-6 text-center">
        <h1 className="section-title">Access denied</h1>
        <p className="mt-2 font-serif text-lg">{session.user.email} is not an admin. Add this user to the <code>admins</code> table.</p>
        <button className="btn-ghost mt-4" onClick={() => supabase!.auth.signOut()}>Sign out</button>
      </div>
    );
  }
  return <Dashboard email={session.user.email ?? ""} />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="royal-card mx-auto mt-8 max-w-sm space-y-3 p-6">
      <h1 className="section-title text-center">Admin Login</h1>
      <input className="field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {err && <p className="text-sm text-red-700">{err}</p>}
      <button className="btn-royal w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

function Dashboard({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("media");
  const [albums, setAlbums] = useState<Album[]>([]);
  const [toast, setToast] = useState("");

  const loadAlbums = useCallback(async () => {
    const { data } = await supabase!.from("albums").select("*").order("year", { ascending: false });
    setAlbums((data ?? []) as Album[]);
  }, []);
  useEffect(() => { loadAlbums(); }, [loadAlbums]);

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  const tabs: [Tab, string][] = [["media", "Media"], ["albums", "Albums"], ["updates", "Updates"], ["events", "Events"], ["comments", "Comments"], ["settings", "Settings"]];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="section-title">Admin Panel</h1>
          <p className="text-xs text-burgundy/70">{email}</p>
        </div>
        <button className="btn-ghost" onClick={() => supabase!.auth.signOut()}>Sign out</button>
      </div>
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`chip ${tab === k ? "chip-active" : ""}`}>{l}</button>
        ))}
      </div>
      {tab === "media" && <MediaTab albums={albums} say={say} />}
      {tab === "albums" && <AlbumsTab albums={albums} reload={loadAlbums} say={say} />}
      {tab === "updates" && <UpdatesTab say={say} />}
      {tab === "events" && <EventsTab say={say} />}
      {tab === "comments" && <CommentsTab say={say} />}
      {tab === "settings" && <SettingsTab say={say} />}
      {toast && <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm rounded-full bg-burgundy px-4 py-2 text-center text-sm text-gold-light shadow-royal md:bottom-6">{toast}</div>}
    </div>
  );
}

/* ---------------- Media ---------------- */
function MediaTab({ albums, say }: { albums: Album[]; say: (m: string) => void }) {
  const [albumId, setAlbumId] = useState("");
  const [category, setCategory] = useState("general");
  const [deity, setDeity] = useState("both");
  const [caption, setCaption] = useState("");
  const [captionTe, setCaptionTe] = useState("");
  const [featured, setFeatured] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [items, setItems] = useState<Media[]>([]);

  const load = useCallback(async (id: string) => {
    if (!id) return setItems([]);
    const { data } = await supabase!.from("media").select("*").eq("album_id", id).order("created_at", { ascending: false });
    setItems((data ?? []) as Media[]);
  }, []);

  useEffect(() => { if (!albumId && albums[0]) setAlbumId(albums[0].id); }, [albums, albumId]);
  useEffect(() => { load(albumId); }, [albumId, load]);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    const album = albums.find((a) => a.id === albumId);
    if (!album || !files.length) return say("Pick an album and files first");
    setBusy(true);
    let ok = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setProgress(`Uploading ${i + 1} / ${files.length}…`);
      let up;
      try {
        up = await uploadToCloudinary(f, `utsav/${album.year}`);
      } catch (err) {
        say(`Failed: ${f.name} — ${(err as Error).message}`);
        continue;
      }
      const { error: dbErr } = await supabase!.from("media").insert({
        album_id: albumId,
        type: up.resource_type === "video" ? "video" : "photo",
        url: up.secure_url,
        storage_path: up.public_id, // Cloudinary public_id
        category, deity,
        caption: caption || null,
        caption_te: captionTe || null,
        featured,
      });
      if (dbErr) {
        await deleteFromCloudinary(up.public_id, up.resource_type === "video" ? "video" : "photo");
        say(dbErr.message);
      } else ok++;
    }
    setBusy(false); setProgress(""); setFiles([]);
    say(`${ok} file(s) uploaded`);
    load(albumId);
  };

  const remove = async (m: Media) => {
    if (!confirm("Delete this item?")) return;
    if (m.storage_path) await deleteFromCloudinary(m.storage_path, m.type);
    await supabase!.from("media").delete().eq("id", m.id);
    say("Deleted"); load(albumId);
  };

  const toggleFeatured = async (m: Media) => {
    await supabase!.from("media").update({ featured: !m.featured }).eq("id", m.id);
    load(albumId);
  };

  if (!albums.length) return <p className="royal-card p-6 text-center font-serif text-lg">Create a year album first (Albums tab).</p>;

  return (
    <div className="space-y-6">
      <form onSubmit={upload} className="royal-card space-y-3 p-4">
        <h2 className="font-display text-lg font-bold">Upload photos & videos</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <select className="field" value={albumId} onChange={(e) => setAlbumId(e.target.value)}>
            {albums.map((a) => <option key={a.id} value={a.id}>{a.year} — {a.title}</option>)}
          </select>
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className="field" value={deity} onChange={(e) => setDeity(e.target.value)}>
            {DEITIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="field" placeholder="Caption in English (optional, applied to all)" value={caption} onChange={(e) => setCaption(e.target.value)} />
          <input className="field font-telugu" placeholder="క్యాప్షన్ (తెలుగు, ఐచ్ఛికం)" value={captionTe} onChange={(e) => setCaptionTe(e.target.value)} />
        </div>
        <input className="field" type="file" accept="image/*,video/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Show on home page</label>
        <button className="btn-royal" disabled={busy}>{busy ? progress : `Upload ${files.length || ""} file(s)`}</button>
      </form>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((m) => (
          <MediaCard key={m.id} m={m} albums={albums} say={say} onFeature={() => toggleFeatured(m)} onRemove={() => remove(m)} onSaved={() => load(albumId)} />
        ))}
      </div>
    </div>
  );
}

function MediaCard({ m, albums, onFeature, onRemove, onSaved, say }: {
  m: Media; albums: Album[]; onFeature: () => void; onRemove: () => void; onSaved: () => void; say: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ caption: m.caption ?? "", caption_te: m.caption_te ?? "", category: m.category as string, deity: m.deity as string, album_id: m.album_id });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase!.from("media").update({ caption: v.caption.trim() || null, caption_te: v.caption_te.trim() || null, category: v.category, deity: v.deity, album_id: v.album_id }).eq("id", m.id);
    if (error) return say(error.message);
    say("Saved"); setOpen(false); onSaved();
  };
  return (
    <div className="royal-card overflow-hidden">
      {m.type === "photo"
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={m.url} alt={m.caption ?? ""} className="aspect-square w-full object-cover" />
        : <video src={`${m.url}#t=0.1`} muted preload="metadata" className="aspect-square w-full object-cover" />}
      <div className="space-y-1 p-2 text-xs">
        <div className="truncate">{m.category} · {m.deity}{m.caption ? ` · ${m.caption}` : ""}</div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full border border-gold px-2 py-0.5" onClick={onFeature}>{m.featured ? "★ Featured" : "☆ Feature"}</button>
          <button className="rounded-full border border-burgundy/40 px-2 py-0.5" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Close" : "Edit"}</button>
          <button className="rounded-full border border-red-400 px-2 py-0.5 text-red-700" onClick={onRemove}>Delete</button>
        </div>
        {open && (
          <form onSubmit={save} className="space-y-2 pt-2">
            <input className="field !py-1.5" placeholder="Caption (English)" value={v.caption} onChange={(e) => setV({ ...v, caption: e.target.value })} />
            <input className="field !py-1.5 font-telugu" placeholder="క్యాప్షన్ (తెలుగు)" value={v.caption_te} onChange={(e) => setV({ ...v, caption_te: e.target.value })} />
            <select className="field !py-1.5" value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
            <select className="field !py-1.5" value={v.deity} onChange={(e) => setV({ ...v, deity: e.target.value })}>{DEITIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select>
            <select className="field !py-1.5" value={v.album_id} onChange={(e) => setV({ ...v, album_id: e.target.value })}>{albums.map((a) => <option key={a.id} value={a.id}>{a.year} — {a.title}</option>)}</select>
            <button className="btn-royal !py-1.5 !text-xs">Save changes</button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------- Albums ---------------- */
const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

function AlbumsTab({ albums, reload, say }: { albums: Album[]; reload: () => void; say: (m: string) => void }) {
  const blank = { year: String(new Date().getFullYear()), title: "", title_te: "", description: "", description_te: "", cover_url: "" };
  const [f, setF] = useState(blank);
  const [editId, setEditId] = useState<string | null>(null);

  const reset = () => { setF(blank); setEditId(null); };
  const edit = (a: Album) => {
    setEditId(a.id); setF({ year: String(a.year), title: a.title, title_te: a.title_te ?? "", description: a.description ?? "", description_te: a.description_te ?? "", cover_url: a.cover_url ?? "" }); toTop();
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = { year: Number(f.year), title: f.title.trim() || f.title_te.trim() || `Festival ${f.year}`, title_te: f.title_te.trim() || null, description: f.description.trim() || null, description_te: f.description_te.trim() || null, cover_url: f.cover_url || null };
    const { error } = editId ? await supabase!.from("albums").update(row).eq("id", editId) : await supabase!.from("albums").insert(row);
    if (error) return say(error.message.includes("duplicate") ? `An album for ${f.year} already exists` : error.message);
    say(editId ? "Album updated" : "Album created"); reset(); reload();
  };
  const remove = async (a: Album) => {
    if (!confirm(`Delete album ${a.year} and all its media records?`)) return;
    const { data } = await supabase!.from("media").select("storage_path,type").eq("album_id", a.id);
    await Promise.all(
      (data ?? [])
        .filter((r: { storage_path: string | null }) => r.storage_path)
        .map((r: { storage_path: string; type: "photo" | "video" }) => deleteFromCloudinary(r.storage_path, r.type))
    );
    await supabase!.from("albums").delete().eq("id", a.id);
    if (editId === a.id) reset();
    say("Album deleted"); reload();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="royal-card space-y-3 p-4">
        <h2 className="font-display text-lg font-bold">{editId ? "Edit album" : "New year album"}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input className="field" type="number" min={1990} max={2100} value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} required />
          <input className="field" placeholder="Title (e.g. Ganesh Utsav 2026)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <input className="field font-telugu" placeholder="శీర్షిక (తెలుగు)" value={f.title_te} onChange={(e) => setF({ ...f, title_te: e.target.value })} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="field" placeholder="Description (English)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <input className="field font-telugu" placeholder="వివరణ (తెలుగు)" value={f.description_te} onChange={(e) => setF({ ...f, description_te: e.target.value })} />
        </div>
        <CoverField value={f.cover_url} onChange={(cover_url) => setF({ ...f, cover_url })} say={say} />
        <div className="flex gap-2">
          <button className="btn-royal">{editId ? "Save changes" : "Create album"}</button>
          {editId && <button type="button" className="btn-ghost" onClick={reset}>Cancel</button>}
        </div>
      </form>
      <ul className="space-y-2">
        {albums.map((a) => (
          <li key={a.id} className={`royal-card flex items-center justify-between gap-3 p-3 ${editId === a.id ? "ring-2 ring-saffron" : ""}`}>
            <span className="min-w-0 truncate"><b className="font-display">{a.year}</b> · {a.title}</span>
            <span className="flex shrink-0 gap-2">
              <button className="rounded-full border border-burgundy/40 px-3 py-1 text-xs" onClick={() => edit(a)}>Edit</button>
              <button className="rounded-full border border-red-400 px-3 py-1 text-xs text-red-700" onClick={() => remove(a)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Updates ---------------- */
function CoverField({ value, onChange, say }: { value: string; onChange: (url: string) => void; say: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    try { const up = await uploadToCloudinary(file, "utsav/covers"); onChange(up.secure_url); }
    catch (e) { say(e instanceof Error ? e.message : "Upload failed"); }
    setBusy(false);
  }
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {value && <img src={value} alt="Cover preview" className="h-14 w-20 rounded-lg object-cover" />}
      <label className="btn-ghost cursor-pointer">{busy ? "Uploading…" : value ? "Change cover image" : "Add cover image"}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      </label>
      {value && <button type="button" className="text-xs text-red-700" onClick={() => onChange("")}>Remove</button>}
    </div>
  );
}

const lines = (t: string) => t.split("\n").map((x) => x.trim()).filter(Boolean);

function UpdatesTab({ say }: { say: (m: string) => void }) {
  const [list, setList] = useState<FestUpdate[]>([]);
  const [events, setEvents] = useState<FestEvent[]>([]);
  const blank = { kind: "general", deity: "both", title: "", title_te: "", body: "", body_te: "", cover_url: "", event_id: "", pinned: false };
  const [f, setF] = useState(blank);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [u, e] = await Promise.all([
      supabase!.from("updates").select("*").order("created_at", { ascending: false }),
      supabase!.from("events").select("*").order("starts_at", { ascending: false }),
    ]);
    setList((u.data ?? []) as FestUpdate[]); setEvents((e.data ?? []) as FestEvent[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const reset = () => { setF(blank); setEditId(null); };
  const edit = (u: FestUpdate) => {
    setEditId(u.id);
    setF({ kind: u.kind, deity: u.deity, title: u.title, title_te: u.title_te ?? "", body: u.body ?? "", body_te: u.body_te ?? "", cover_url: u.cover_url ?? "", event_id: u.event_id ?? "", pinned: u.pinned });
    toTop();
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim() && !f.title_te.trim()) return say("Add a title in English or Telugu");
    const row = {
      ...f, title: f.title.trim() || f.title_te.trim(), title_te: f.title_te.trim() || null,
      body: isEmptyRich(f.body) ? null : f.body, body_te: isEmptyRich(f.body_te) ? null : f.body_te,
      cover_url: f.cover_url || null, event_id: f.event_id || null,
    };
    const { error } = editId ? await supabase!.from("updates").update(row).eq("id", editId) : await supabase!.from("updates").insert(row);
    if (error) return say(error.message);
    say(editId ? "Update saved" : "Published"); setF({ ...blank, kind: f.kind, deity: f.deity }); setEditId(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this update and its comments?")) return;
    await supabase!.from("updates").delete().eq("id", id);
    if (editId === id) reset();
    say("Deleted"); load();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="royal-card space-y-3 p-4">
        <h2 className="font-display text-lg font-bold">{editId ? "Edit update" : "Publish update"}</h2>
        <p className="text-xs text-burgundy/70">Fill either language or both. Visitors see Telugu when it is filled, otherwise English.</p>
        <div className="grid gap-3 md:grid-cols-3">
          <select className="field" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>{UPDATE_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</select>
          <select className="field" value={f.deity} onChange={(e) => setF({ ...f, deity: e.target.value })}>{DEITIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select>
          <select className="field" value={f.event_id} onChange={(e) => setF({ ...f, event_id: e.target.value })}>
            <option value="">No linked event</option>{events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="field" placeholder="Title (English)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <input className="field font-telugu" placeholder="శీర్షిక (తెలుగు)" value={f.title_te} onChange={(e) => setF({ ...f, title_te: e.target.value })} />
        </div>
        <p className="text-xs font-medium text-burgundy/70">Details (English)</p>
        <RichEditor placeholder="Details (English)" value={f.body} onChange={(body) => setF({ ...f, body })} />
        <p className="text-xs font-medium text-burgundy/70">వివరాలు (తెలుగు)</p>
        <RichEditor placeholder="వివరాలు (తెలుగు)" value={f.body_te} onChange={(body_te) => setF({ ...f, body_te })} />
        <CoverField value={f.cover_url} onChange={(cover_url) => setF({ ...f, cover_url })} say={say} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.pinned} onChange={(e) => setF({ ...f, pinned: e.target.checked })} /> Pin to top</label>
        <div className="flex gap-2">
          <button className="btn-royal">{editId ? "Save changes" : "Publish"}</button>
          {editId && <button type="button" className="btn-ghost" onClick={reset}>Cancel</button>}
        </div>
      </form>
      <ul className="space-y-2">
        {list.map((u) => (
          <li key={u.id} className={`royal-card flex items-center justify-between gap-3 p-3 ${editId === u.id ? "ring-2 ring-saffron" : ""}`}>
            <span className="min-w-0 truncate">{u.pinned ? "📌 " : ""}<b className="font-telugu">{u.title_te || u.title}</b> <span className="text-xs text-burgundy/60">({u.kind}) · 👁 {u.views ?? 0} · ♥ {u.likes ?? 0} · 💬 {u.comments_count ?? 0}</span></span>
            <span className="flex shrink-0 gap-2">
              <button className="rounded-full border border-burgundy/40 px-3 py-1 text-xs" onClick={() => edit(u)}>Edit</button>
              <button className="rounded-full border border-red-400 px-3 py-1 text-xs text-red-700" onClick={() => remove(u.id)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Events ---------------- */
const localInput = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function EventsTab({ say }: { say: (m: string) => void }) {
  const [list, setList] = useState<FestEvent[]>([]);
  const blank = { title: "", title_te: "", description: "", description_te: "", starts_at: "", location: "", deity: "both", category: "general", cover_url: "",
    route_start: "", route_via: "", route_end: "", organizer: "", schedule: "", info: "",
    location_te: "", route_start_te: "", route_via_te: "", route_end_te: "", organizer_te: "", info_te: "" };
  const [f, setF] = useState(blank);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase!.from("events").select("*").order("starts_at", { ascending: true });
    setList((data ?? []) as FestEvent[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const reset = () => { setF(blank); setEditId(null); };
  const edit = (ev: FestEvent) => {
    setEditId(ev.id);
    setF({
      title: ev.title, title_te: ev.title_te ?? "", description: ev.description ?? "", description_te: ev.description_te ?? "",
      starts_at: localInput(ev.starts_at), location: ev.location ?? "", deity: ev.deity, category: ev.category ?? "general", cover_url: ev.cover_url ?? "",
      route_start: ev.route_start ?? "", route_via: ev.route_via ?? "", route_end: ev.route_end ?? "", organizer: ev.organizer ?? "",
      schedule: (ev.schedule ?? []).map((r) => (r.label_te ? `${r.time} | ${r.label} | ${r.label_te}` : `${r.time} | ${r.label}`)).join("\n"), info: (ev.info ?? []).join("\n"),
      location_te: ev.location_te ?? "", route_start_te: ev.route_start_te ?? "", route_via_te: ev.route_via_te ?? "", route_end_te: ev.route_end_te ?? "",
      organizer_te: ev.organizer_te ?? "", info_te: (ev.info_te ?? []).join("\n"),
    });
    toTop();
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim() && !f.title_te.trim()) return say("Add a title in English or Telugu");
    const schedule = lines(f.schedule).map((l) => {
      const [time, label = "", label_te = ""] = l.split("|").map((x) => x.trim());
      return { time, label: label || label_te, ...(label_te ? { label_te } : {}) };
    }).filter((r) => r.time && r.label);
    const info = lines(f.info);
    const infoTe = lines(f.info_te);
    const n = (v: string) => v.trim() || null;
    const row = {
      title: f.title.trim() || f.title_te.trim(), title_te: n(f.title_te),
      description: isEmptyRich(f.description) ? null : f.description, description_te: isEmptyRich(f.description_te) ? null : f.description_te,
      starts_at: new Date(f.starts_at).toISOString(), location: n(f.location), deity: f.deity, category: f.category, cover_url: n(f.cover_url),
      route_start: n(f.route_start), route_via: n(f.route_via), route_end: n(f.route_end), organizer: n(f.organizer),
      schedule: schedule.length ? schedule : null, info: info.length ? info : null,
      location_te: n(f.location_te), route_start_te: n(f.route_start_te), route_via_te: n(f.route_via_te), route_end_te: n(f.route_end_te),
      organizer_te: n(f.organizer_te), info_te: infoTe.length ? infoTe : null,
    };
    const { error } = editId ? await supabase!.from("events").update(row).eq("id", editId) : await supabase!.from("events").insert(row);
    if (error) return say(error.message);
    say(editId ? "Event saved" : "Event added"); reset(); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await supabase!.from("events").delete().eq("id", id);
    if (editId === id) reset();
    say("Deleted"); load();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="royal-card space-y-3 p-4">
        <h2 className="font-display text-lg font-bold">{editId ? "Edit event" : "Add event"}</h2>
        <p className="text-xs text-burgundy/70">Fill either language or both. Visitors see Telugu when it is filled, otherwise English.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="field" placeholder="Title (English)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <input className="field font-telugu" placeholder="శీర్షిక (తెలుగు)" value={f.title_te} onChange={(e) => setF({ ...f, title_te: e.target.value })} />
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <input className="field" type="datetime-local" value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} required />
          <input className="field" placeholder="Location (if no route)" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
          <select className="field" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            <option value="general">General</option><option value="procession">Procession</option><option value="pooja">Pooja & Rituals</option><option value="community">Community</option>
          </select>
          <select className="field" value={f.deity} onChange={(e) => setF({ ...f, deity: e.target.value })}>{DEITIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <input className="field" placeholder="Route start" value={f.route_start} onChange={(e) => setF({ ...f, route_start: e.target.value })} />
          <input className="field" placeholder="Route via" value={f.route_via} onChange={(e) => setF({ ...f, route_via: e.target.value })} />
          <input className="field" placeholder="Destination" value={f.route_end} onChange={(e) => setF({ ...f, route_end: e.target.value })} />
          <input className="field" placeholder="Organized by" value={f.organizer} onChange={(e) => setF({ ...f, organizer: e.target.value })} />
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <input className="field font-telugu" placeholder="ప్రదేశం (తెలుగు)" value={f.location_te} onChange={(e) => setF({ ...f, location_te: e.target.value })} />
          <input className="field font-telugu" placeholder="ప్రారంభ స్థలం (తెలుగు)" value={f.route_start_te} onChange={(e) => setF({ ...f, route_start_te: e.target.value })} />
          <input className="field font-telugu" placeholder="మీదుగా (తెలుగు)" value={f.route_via_te} onChange={(e) => setF({ ...f, route_via_te: e.target.value })} />
          <input className="field font-telugu" placeholder="గమ్యం (తెలుగు)" value={f.route_end_te} onChange={(e) => setF({ ...f, route_end_te: e.target.value })} />
        </div>
        <input className="field font-telugu md:w-1/2" placeholder="నిర్వహణ (తెలుగు)" value={f.organizer_te} onChange={(e) => setF({ ...f, organizer_te: e.target.value })} />
        <p className="text-xs font-medium text-burgundy/70">Description (English)</p>
        <RichEditor placeholder="Description (English)" value={f.description} onChange={(description) => setF({ ...f, description })} />
        <p className="text-xs font-medium text-burgundy/70">వివరణ (తెలుగు)</p>
        <RichEditor placeholder="వివరణ (తెలుగు)" value={f.description_te} onChange={(description_te) => setF({ ...f, description_te })} />
        <div className="grid gap-3 md:grid-cols-3">
          <textarea className="field min-h-24" placeholder={"Schedule, one per line (Telugu optional):\n6:30 PM | Bhaktha gathering | భక్తుల సమావేశం"} value={f.schedule} onChange={(e) => setF({ ...f, schedule: e.target.value })} />
          <textarea className="field min-h-24" placeholder={"Important information (English), one per line:\nAll are welcome"} value={f.info} onChange={(e) => setF({ ...f, info: e.target.value })} />
          <textarea className="field min-h-24 font-telugu" placeholder={"ముఖ్య సమాచారం (తెలుగు), ఒక్కో లైన్‌కు ఒకటి:\nఅందరికీ స్వాగతం"} value={f.info_te} onChange={(e) => setF({ ...f, info_te: e.target.value })} />
        </div>
        <CoverField value={f.cover_url} onChange={(cover_url) => setF({ ...f, cover_url })} say={say} />
        <div className="flex gap-2">
          <button className="btn-royal">{editId ? "Save changes" : "Add event"}</button>
          {editId && <button type="button" className="btn-ghost" onClick={reset}>Cancel</button>}
        </div>
      </form>
      <ul className="space-y-2">
        {list.map((ev) => (
          <li key={ev.id} className={`royal-card flex items-center justify-between gap-3 p-3 ${editId === ev.id ? "ring-2 ring-saffron" : ""}`}>
            <span className="min-w-0 truncate"><b className="font-telugu">{ev.title_te || ev.title}</b> <span className="text-xs text-burgundy/60">{new Date(ev.starts_at).toLocaleString("en-IN")}</span></span>
            <span className="flex shrink-0 gap-2">
              <button className="rounded-full border border-burgundy/40 px-3 py-1 text-xs" onClick={() => edit(ev)}>Edit</button>
              <button className="rounded-full border border-red-400 px-3 py-1 text-xs text-red-700" onClick={() => remove(ev.id)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Comments (moderation) ---------------- */
function CommentsTab({ say }: { say: (m: string) => void }) {
  const [list, setList] = useState<(Comment & { updates?: { title: string; title_te: string | null } | null })[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase!.from("comments").select("*, updates(title,title_te)").order("created_at", { ascending: false }).limit(200);
    setList((data ?? []) as typeof list);
  }, []);
  useEffect(() => { load(); }, [load]);
  const toggle = async (c: Comment) => { await supabase!.from("comments").update({ hidden: !c.hidden }).eq("id", c.id); say(c.hidden ? "Comment shown" : "Comment hidden"); load(); };
  const remove = async (id: string) => { if (!confirm("Delete this comment?")) return; await supabase!.from("comments").delete().eq("id", id); say("Deleted"); load(); };
  return (
    <ul className="space-y-2">
      {list.map((c) => (
        <li key={c.id} className={`royal-card flex items-start justify-between gap-3 p-3 ${c.hidden ? "opacity-60" : ""}`}>
          <div className="min-w-0 text-sm">
            <p><b>{c.name}</b> <span className="text-xs text-burgundy/60">on {c.updates?.title_te || c.updates?.title} · {new Date(c.created_at).toLocaleString("en-IN")}{c.hidden ? " · hidden" : ""}</span></p>
            <p className="whitespace-pre-line font-telugu">{c.body}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button className="rounded-full border border-burgundy/40 px-3 py-1 text-xs" onClick={() => toggle(c)}>{c.hidden ? "Show" : "Hide"}</button>
            <button className="rounded-full border border-red-400 px-3 py-1 text-xs text-red-700" onClick={() => remove(c.id)}>Delete</button>
          </div>
        </li>
      ))}
      {!list.length && <li className="royal-card p-6 text-center">No comments yet.</li>}
    </ul>
  );
}

/* ---------------- Settings ---------------- */
// Each pair is shown side by side: English first, Telugu second. Visitors see the language they picked, falling back to the other.
const SETTING_PAIRS: [[string, string], [string, string]][] = [
  [["festival_name", "Festival name (English)"], ["festival_name_te", "ఉత్సవం పేరు (తెలుగు)"]],
  [["tagline", "Tagline (English)"], ["tagline_line_te", "ట్యాగ్‌లైన్ (తెలుగు)"]],
  [["headline", "Headline (English)"], ["tagline_te", "హెడ్‌లైన్ (తెలుగు)"]],
  [["hero_script", "Script text on the banner (English)"], ["hero_script_te", "బ్యానర్ స్క్రిప్ట్ టెక్స్ట్ (తెలుగు)"]],
  [["countdown_label", "Countdown label (English)"], ["countdown_label_te", "కౌంట్‌డౌన్ లేబుల్ (తెలుగు)"]],
];
const SETTING_FIELDS: [string, string][] = [["join_url", "Join Team link (WhatsApp group, form, etc.)"]];

const RICH_SETTINGS: [string, string][] = [
  ["subtitle", "Subtitle under the tagline, home page (English)"],
  ["subtitle_te", "ట్యాగ్‌లైన్ కింద సబ్‌టైటిల్ (తెలుగు)"],
  ["motto", "Quote shown on update and event pages (English)"],
  ["motto_te", "అప్‌డేట్, ఈవెంట్ పేజీలలో కోట్ (తెలుగు)"],
];

function SettingsTab({ say }: { say: (m: string) => void }) {
  const [s, setS] = useState<Settings>({ countdown_target: "", hero_image: "" });

  useEffect(() => {
    supabase!.from("settings").select("key,value").then(({ data }) => {
      const o: Settings = {};
      (data ?? []).forEach((r: { key: string; value: string }) => (o[r.key] = r.value));
      setS((prev) => ({ ...prev, ...o }));
    });
  }, []);

  const toLocal = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const rows = Object.entries(s).map(([key, value]) => ({ key, value: value ?? "" }));
    const { error } = await supabase!.from("settings").upsert(rows);
    say(error ? error.message : "Settings saved");
  };

  return (
    <form onSubmit={save} className="royal-card space-y-3 p-4">
      <h2 className="font-display text-lg font-bold">Home page and banners</h2>
      {SETTING_PAIRS.map((pair) => (
        <div key={pair[0][0]} className="grid gap-3 md:grid-cols-2">
          {pair.map(([k, label]) => (
            <label key={k} className="block text-xs text-burgundy/70">{label}
              <input className="field mt-1 font-telugu" value={s[k] ?? ""} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
            </label>
          ))}
        </div>
      ))}
      {SETTING_FIELDS.map(([k, label]) => (
        <label key={k} className="block text-xs text-burgundy/70">{label}
          <input className="field mt-1 font-telugu" value={s[k] ?? ""} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
        </label>
      ))}
      {RICH_SETTINGS.map(([k, label]) => (
        <div key={k} className="space-y-1">
          <p className="text-xs text-burgundy/70">{label}</p>
          <RichEditor placeholder={label} minHeight="6rem" value={s[k] ?? ""} onChange={(html) => setS((prev) => ({ ...prev, [k]: html }))} />
        </div>
      ))}
      <p className="text-xs text-burgundy/70">Banner photo (shown on the home hero and page banners)</p>
      <CoverField value={s.hero_image ?? ""} onChange={(hero_image) => setS({ ...s, hero_image })} say={say} />
      <label className="block text-xs text-burgundy/70">Countdown target (leave empty to use the next upcoming event)
        <input className="field mt-1" type="datetime-local" value={toLocal(s.countdown_target)}
          onChange={(e) => setS({ ...s, countdown_target: e.target.value ? new Date(e.target.value).toISOString() : "" })} />
      </label>
      <button className="btn-royal">Save</button>
    </form>
  );
}
