"use client";

import type { ReactNode } from "react";
import { money } from "@/lib/finance";

export function PageHead({ title, blurb, actions }: { title: string; blurb?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="section-title">{title}</h1>{blurb && <p className="mt-1 max-w-2xl text-sm text-burgundy/70">{blurb}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2 print:hidden">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, tone, hint }: { label: string; value: string; tone?: "good" | "bad"; hint?: string }) {
  return (
    <div className="royal-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-burgundy/60">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${tone === "bad" ? "text-red-700" : tone === "good" ? "text-emerald-700" : "text-burgundy"}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-burgundy/60">{hint}</p>}
    </div>
  );
}

export function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="royal-card mb-6 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-lg font-bold text-burgundy">{title}</h2>{right}</div>
      {children}
    </section>
  );
}

export const Amt = ({ v, signed = false }: { v: number; signed?: boolean }) => (
  <span className={`tabular-nums ${signed && v < 0 ? "text-red-700" : ""}`}>{money(v)}</span>
);

export function Table({ head, rows, right = [], foot, empty = "No records." }: { head: string[]; rows: ReactNode[][]; right?: number[]; foot?: ReactNode[]; empty?: string }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-burgundy/70">{empty}</p>;
  const th = (i: number) => `px-3 py-2 text-xs font-semibold uppercase tracking-wide ${right.includes(i) ? "text-right" : "text-left"}`;
  const td = (i: number) => `px-3 py-2 align-top ${right.includes(i) ? "text-right" : ""}`;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead className="bg-blush text-burgundy"><tr>{head.map((h, i) => <th key={h + i} scope="col" className={th(i)}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gold/20">{rows.map((r, ri) => <tr key={ri}>{r.map((c, i) => <td key={i} className={td(i)}>{c}</td>)}</tr>)}</tbody>
        {foot && <tfoot className="border-t-2 border-gold/50 bg-ivory font-semibold"><tr>{foot.map((c, i) => <td key={i} className={td(i)}>{c}</td>)}</tr></tfoot>}
      </table>
    </div>
  );
}

/** Income vs expense columns per period. Accessible name summarises the data; the numbers are also in the tables on each page. */
export function Bars({ series, aLabel = "Income", bLabel = "Expenses" }: { series: { label: string; a: number; b: number }[]; aLabel?: string; bLabel?: string }) {
  const max = Math.max(1, ...series.flatMap((s) => [s.a, s.b])), W = 640, H = 220, base = 190, step = W / Math.max(1, series.length), bw = Math.min(16, step / 3);
  const total = (k: "a" | "b") => money(series.reduce((x, s) => x + s[k], 0));
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${aLabel} ${total("a")} and ${bLabel} ${total("b")} across ${series.length} periods`} className="h-auto w-full">
        <line x1="0" x2={W} y1={base} y2={base} stroke="#D4AF37" strokeOpacity=".6" />
        {series.map((s, i) => {
          const x = i * step + step / 2, ha = (s.a / max) * 160, hb = (s.b / max) * 160;
          return (
            <g key={s.label + i}>
              <rect x={x - bw - 1} y={base - ha} width={bw} height={ha} rx="2" fill="#B8860B"><title>{`${s.label} ${aLabel}: ${money(s.a)}`}</title></rect>
              <rect x={x + 1} y={base - hb} width={bw} height={hb} rx="2" fill="#6B0F1A"><title>{`${s.label} ${bLabel}: ${money(s.b)}`}</title></rect>
              <text x={x} y={base + 16} textAnchor="middle" fontSize="11" fill="#6B0F1A">{s.label}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 flex gap-4 text-xs text-burgundy/80"><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#B8860B]" />{aLabel}</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-burgundy" />{bLabel}</span></figcaption>
    </figure>
  );
}

export function ShareBars({ rows, total }: { rows: { label: string; value: number }[]; total: number }) {
  if (!rows.length || total <= 0) return <p className="py-4 text-sm text-burgundy/70">Nothing to show yet.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => {
        const pct = Math.round((r.value / total) * 100);
        return (
          <li key={r.label} className="text-sm">
            <div className="flex justify-between gap-3"><span>{r.label}</span><span className="tabular-nums">{money(r.value)} · {pct}%</span></div>
            <div className="mt-1 h-2 rounded-full bg-blush" role="presentation"><div className="h-2 rounded-full bg-burgundy" style={{ width: `${Math.max(2, pct)}%` }} /></div>
          </li>
        );
      })}
    </ul>
  );
}

export const Badge = ({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "good" | "warn" | "bad" }) => (
  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tone === "good" ? "bg-emerald-100 text-emerald-800" : tone === "warn" ? "bg-amber-100 text-amber-900" : tone === "bad" ? "bg-red-100 text-red-800" : "bg-blush text-burgundy"}`}>{children}</span>
);

export const PrintButton = () => <button type="button" className="btn-ghost" onClick={() => window.print()}>Print / Save as PDF</button>;
