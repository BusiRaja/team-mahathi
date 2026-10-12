"use client";

import { useMemo, useRef, useState } from "react";
import { downloadCsv, fyOf, money } from "@/lib/finance";
import { uploadToCloudinary } from "@/lib/cloudinary-client";
import { useFin } from "@/lib/useFinance";
import { Section, Stat, PrintButton } from "./ui";

export type Form = Record<string, string | boolean>;
export interface Field {
  key: string; label: string; type: "text" | "number" | "date" | "select" | "textarea" | "checkbox" | "file" | "email" | "tel";
  options?: { value: string; label: string }[]; required?: boolean; zero?: boolean; placeholder?: string; wide?: boolean;
  showIf?: (f: Form) => boolean; suggest?: string[]; help?: string;
}
export interface Col<T> { label: string; cell: (r: T) => React.ReactNode; csv: (r: T) => string | number; right?: boolean }
export interface Filter<T> { label: string; options: { value: string; label: string }[]; test: (r: T, v: string) => boolean }
export interface CrudProps<T extends { id: string }> {
  table: string; title: string; blurb?: string; noun: string; rows: T[]; fields: Field[]; blank: Form; cols: Col<T>[];
  dateKey?: string; search?: (r: T) => string; filters?: Filter<T>[];
  stats?: (rows: T[]) => { label: string; value: string; tone?: "good" | "bad"; hint?: string }[];
  footer?: (rows: T[]) => React.ReactNode; validate?: (f: Form) => string | null;
  normalize?: (p: Record<string, unknown>) => Record<string, unknown>; exportName: string; allYears?: boolean;
  describe?: (r: T) => string;
}

const PAGE = 100;

export default function Crud<T extends { id: string }>(p: CrudProps<T>) {
  const { year, sm, save, remove, askReason, say } = useFin();
  const [form, setForm] = useState<Form>(p.blank);
  const [editId, setEditId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [fv, setFv] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [upBusy, setUpBusy] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let r = p.rows;
    if (p.dateKey && !p.allYears && year !== "all") r = r.filter((x) => fyOf(String((x as Record<string, unknown>)[p.dateKey!]), sm) === year);
    if (needle && p.search) r = r.filter((x) => p.search!(x).toLowerCase().includes(needle));
    p.filters?.forEach((f, i) => { const v = fv[i]; if (v) r = r.filter((x) => f.test(x, v)); });
    return p.dateKey ? [...r].sort((a, b) => String((b as Record<string, unknown>)[p.dateKey!]).localeCompare(String((a as Record<string, unknown>)[p.dateKey!]))) : r;
  }, [p.rows, p.dateKey, p.allYears, p.search, p.filters, year, sm, q, fv]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => { setForm(p.blank); setEditId(null); setErr(""); };
  const edit = (r: T) => {
    const f: Form = { ...p.blank };
    for (const fd of p.fields) { const v = (r as Record<string, unknown>)[fd.key]; f[fd.key] = fd.type === "checkbox" ? Boolean(v) : v == null ? "" : String(v); }
    setForm(f); setEditId(r.id); setErr(""); top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    const visible = p.fields.filter((f) => !f.showIf || f.showIf(form));
    const missing = visible.find((f) => f.required && (form[f.key] === "" || form[f.key] == null));
    if (missing) return setErr(`${missing.label} is required`);
    const bad = p.validate?.(form); if (bad) return setErr(bad);
    let payload: Record<string, unknown> = {};
    for (const f of p.fields) {
      const v = form[f.key]; const on = !f.showIf || f.showIf(form);
      payload[f.key] = f.type === "checkbox" ? Boolean(v) : !on ? (f.type === "number" ? (f.zero ? 0 : null) : null)
        : f.type === "number" ? (v === "" ? (f.zero || f.required ? 0 : null) : Number(v)) : v === "" ? null : String(v).trim();
    }
    if (p.normalize) payload = p.normalize(payload);
    let reason: string | null = null;
    if (editId) { reason = await askReason({ title: `Save changes to this ${p.noun}?`, confirm: "Save changes" }); if (!reason) return; }
    setBusy(true);
    const er = await save(p.table, editId, payload, reason);
    setBusy(false);
    if (er) return setErr(er);
    say(editId ? `${cap(p.noun)} updated` : `${cap(p.noun)} added`); reset();
  };

  const del = async (r: T) => {
    const reason = await askReason({ title: `Delete this ${p.noun}${p.describe ? `: ${p.describe(r)}` : ""}?`, confirm: "Delete", danger: true });
    if (!reason) return;
    const er = await remove(p.table, r.id, reason);
    if (er) return say(er);
    if (editId === r.id) reset();
    say(`${cap(p.noun)} deleted`);
  };

  const pick = async (key: string, file?: File) => {
    if (!file) return;
    if (!/^(image\/|application\/pdf)/.test(file.type)) return setErr("Receipts must be an image or a PDF");
    setUpBusy(true);
    try { const up = await uploadToCloudinary(file, "utsav/receipts"); setForm((f) => ({ ...f, [key]: up.secure_url })); }
    catch (x) { setErr((x as Error).message); }
    setUpBusy(false);
  };

  const input = (f: Field) => {
    const common = { id: `f-${p.table}-${f.key}`, className: "field mt-1", required: f.required };
    const v = form[f.key];
    switch (f.type) {
      case "select": return <select {...common} value={String(v ?? "")} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}><option value="">{f.required ? "Select…" : "None"}</option>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
      case "textarea": return <textarea {...common} className="field mt-1 min-h-20 font-telugu" value={String(v ?? "")} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />;
      case "checkbox": return <input type="checkbox" className="mt-2 h-4 w-4" id={common.id} checked={Boolean(v)} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} />;
      case "file": return (
        <div className="mt-1 flex items-center gap-3">
          <label className="btn-ghost cursor-pointer">{upBusy ? "Uploading…" : v ? "Replace file" : "Attach receipt"}<input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => pick(f.key, e.target.files?.[0])} /></label>
          {v ? <><a href={String(v)} target="_blank" rel="noreferrer" className="text-sm text-burgundy underline">View</a><button type="button" className="text-xs text-red-700" onClick={() => setForm({ ...form, [f.key]: "" })}>Remove</button></> : null}
        </div>);
      default: return (
        <>
          <input {...common} type={f.type} step={f.type === "number" ? "0.01" : undefined} min={f.type === "number" ? 0 : undefined} inputMode={f.type === "number" ? "decimal" : undefined}
            list={f.suggest ? `dl-${p.table}-${f.key}` : undefined} placeholder={f.placeholder} value={String(v ?? "")} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
          {f.suggest && <datalist id={`dl-${p.table}-${f.key}`}>{f.suggest.map((s) => <option key={s} value={s} />)}</datalist>}
        </>);
    }
  };

  const stats = p.stats?.(rows);
  const exportCsv = () => downloadCsv(p.exportName, p.cols.map((c) => c.label), rows.map((r) => p.cols.map((c) => c.csv(r))));

  return (
    <div>
      {stats && <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">{stats.map((s) => <Stat key={s.label} {...s} />)}</div>}

      <div ref={top} />
      <form onSubmit={submit} className={`royal-card mb-6 space-y-3 p-4 print:hidden ${editId ? "ring-2 ring-saffron" : ""}`} noValidate={false}>
        <h2 className="font-display text-lg font-bold text-burgundy">{editId ? `Edit ${p.noun}` : `Add ${p.noun}`}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {p.fields.filter((f) => !f.showIf || f.showIf(form)).map((f) => (
            <div key={f.key} className={f.wide || f.type === "textarea" ? "md:col-span-3" : f.type === "checkbox" ? "flex items-center gap-2 md:col-span-1" : ""}>
              {f.type === "checkbox" ? <><label htmlFor={`f-${p.table}-${f.key}`} className="text-sm font-medium">{f.label}</label>{input(f)}</>
                : <><label htmlFor={`f-${p.table}-${f.key}`} className="text-sm font-medium">{f.label}{f.required && <span aria-hidden className="text-red-700"> *</span>}</label>{input(f)}{f.help && <p className="mt-0.5 text-xs text-burgundy/60">{f.help}</p>}</>}
            </div>
          ))}
        </div>
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        <div className="flex gap-2">
          <button className="btn-royal" disabled={busy || upBusy}>{busy ? "Saving…" : editId ? "Save changes" : `Add ${p.noun}`}</button>
          {editId && <button type="button" className="btn-ghost" onClick={reset}>Cancel</button>}
        </div>
      </form>

      <Section title={p.title} right={<div className="flex flex-wrap gap-2 print:hidden"><button className="btn-ghost" onClick={exportCsv} disabled={!rows.length}>Download CSV</button><PrintButton /></div>}>
        {p.blurb && <p className="mb-3 text-sm text-burgundy/70">{p.blurb}</p>}
        <div className="mb-3 flex flex-wrap items-center gap-2 print:hidden">
          {p.search && <input className="field !w-full sm:!w-64" placeholder="Search…" aria-label="Search" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} />}
          {p.filters?.map((f, i) => (
            <select key={f.label} className="field !w-auto" aria-label={f.label} value={fv[i] ?? ""} onChange={(e) => { setFv({ ...fv, [i]: e.target.value }); setShown(PAGE); }}>
              <option value="">{f.label}: all</option>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
          <span className="ml-auto text-xs text-burgundy/60">{rows.length} record{rows.length === 1 ? "" : "s"}</span>
        </div>
        {rows.length === 0 ? <p className="py-6 text-center text-sm text-burgundy/70">No records{q || Object.values(fv).some(Boolean) ? " match these filters" : " for this year yet"}.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="bg-blush text-burgundy"><tr>
                {p.cols.map((c) => <th key={c.label} scope="col" className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${c.right ? "text-right" : "text-left"}`}>{c.label}</th>)}
                <th scope="col" className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide print:hidden">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gold/20">
                {rows.slice(0, shown).map((r) => (
                  <tr key={r.id} className={editId === r.id ? "bg-amber-50" : ""}>
                    {p.cols.map((c) => <td key={c.label} className={`px-3 py-2 align-top ${c.right ? "text-right" : ""}`}>{c.cell(r)}</td>)}
                    <td className="whitespace-nowrap px-3 py-2 text-right print:hidden">
                      <button className="mr-1 rounded-full border border-burgundy/40 px-3 py-1 text-xs" onClick={() => edit(r)}>Edit</button>
                      <button className="rounded-full border border-red-400 px-3 py-1 text-xs text-red-700" onClick={() => del(r)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > shown && <button className="btn-ghost mx-auto mt-3 block print:hidden" onClick={() => setShown(shown + PAGE)}>Show more ({rows.length - shown} left)</button>}
          </div>
        )}
        {p.footer && rows.length > 0 && <div className="mt-4">{p.footer(rows)}</div>}
      </Section>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export { money };
