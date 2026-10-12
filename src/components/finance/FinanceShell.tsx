"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fyLabel, fyOf, today, yearSummaries } from "@/lib/finance";
import { deleteRow, FinContext, loadFinance, saveRow, type FinCtx } from "@/lib/useFinance";
import { emptyData } from "@/lib/finance";

const NAV: { group: string; items: [string, string][] }[] = [
  { group: "Overview", items: [["/admin/finance", "Dashboard"]] },
  { group: "Transactions", items: [["/admin/finance/expenses", "Expenses"], ["/admin/finance/donations", "Donations"], ["/admin/finance/auctions", "Auctions"], ["/admin/finance/sponsorships", "Sponsorships"]] },
  { group: "Events & Budgets", items: [["/admin/finance/events", "Events & Budgets"]] },
  { group: "Reports & Analytics", items: [["/admin/finance/reports/day-wise", "Day-wise"], ["/admin/finance/reports/year-wise", "Year-wise"], ["/admin/finance/reports/donors", "Donors"], ["/admin/finance/reports/sponsors", "Sponsors"], ["/admin/finance/reports/insights", "Insights"]] },
  { group: "Statements", items: [["/admin/finance/export", "Export & Statements"]] },
  { group: "Setup", items: [["/admin/finance/categories", "Categories"], ["/admin/finance/settings", "Settings & Audit Log"]] },
];

type Gate = "checking" | "signedOut" | "notAdmin" | "ok";
interface Ask { title: string; confirm: string; danger?: boolean; resolve: (v: string | null) => void }

export default function FinanceShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [gate, setGate] = useState<Gate>("checking");
  const [data, setData] = useState(emptyData());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [year, setYear] = useState<number | "all" | null>(null);
  const [toast, setToast] = useState("");
  const [ask, setAsk] = useState<Ask | null>(null);

  const checkGate = useCallback(async () => {
    if (!supabase) return setGate("signedOut");
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return setGate("signedOut");
    const { data: a } = await supabase.from("admins").select("user_id").eq("user_id", s.session.user.id).maybeSingle();
    setGate(a ? "ok" : "notAdmin");
  }, []);
  useEffect(() => {
    checkGate();
    const sub = supabase?.auth.onAuthStateChange(() => { checkGate(); });
    return () => sub?.data.subscription.unsubscribe();
  }, [checkGate]);

  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await loadFinance()); } catch (e) { setError((e as Error).message); }
    setLoading(false);
  }, []);
  useEffect(() => { if (gate === "ok") reload(); }, [gate, reload]);

  const sm = data.startMonth;
  const summaries = useMemo(() => yearSummaries(data), [data]);
  const currentFy = fyOf(today(), sm);
  const yearOptions = useMemo(() => [...new Set([...summaries.map((s) => s.year), currentFy])].sort((a, b) => b - a), [summaries, currentFy]);
  const activeYear = year ?? currentFy;

  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(""), 3500); }, []);
  const askReason = useCallback((o: { title: string; confirm: string; danger?: boolean }) => new Promise<string | null>((resolve) => setAsk({ ...o, resolve })), []);
  const save = useCallback(async (table: string, id: string | null, row: Record<string, unknown>, reason: string | null) => {
    const err = await saveRow(table, id, row, reason); if (!err) await reload(); return err;
  }, [reload]);
  const remove = useCallback(async (table: string, id: string, reason: string) => {
    const err = await deleteRow(table, id, reason); if (!err) await reload(); return err;
  }, [reload]);

  const ctx: FinCtx = { data, loading, error, reload, year: activeYear, setYear, yearOptions, sm, say, askReason, save, remove };

  if (gate === "checking") return <p className="py-16 text-center text-burgundy/70" role="status">Checking your access…</p>;
  if (gate !== "ok") {
    return (
      <div className="royal-card mx-auto mt-8 max-w-md p-6 text-center">
        <h1 className="section-title">Finance</h1>
        <p className="mt-3 text-sm">{gate === "notAdmin" ? "Your account is signed in but is not an admin, so finance records are not available to it." : "Please sign in as an admin to open the finance records."}</p>
        <Link href="/admin" className="btn-royal mt-4">{gate === "notAdmin" ? "Back to Admin" : "Go to admin sign in"}</Link>
      </div>
    );
  }

  return (
    <FinContext.Provider value={ctx}>
      <div className="print:hidden">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin" className="text-sm font-medium text-burgundy">← Admin panel</Link>
          <label className="flex items-center gap-2 text-sm">Financial year
            <select className="field !w-auto !py-1.5" value={String(activeYear)} onChange={(e) => setYear(e.target.value === "all" ? "all" : Number(e.target.value))} aria-label="Financial year">
              <option value="all">All years</option>
              {yearOptions.map((y) => <option key={y} value={y}>{fyLabel(y, sm)}</option>)}
            </select>
          </label>
        </div>
        <nav aria-label="Finance sections" className="no-scrollbar mb-6 flex gap-5 overflow-x-auto border-b border-gold/30 pb-2">
          {NAV.map((g) => (
            <div key={g.group} className="shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-burgundy/50">{g.group}</p>
              <div className="mt-1 flex gap-1.5">
                {g.items.map(([href, label]) => (
                  <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={`chip !px-3 !py-1.5 ${path === href ? "chip-active" : ""}`}>{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
      {error && <p role="alert" className="royal-card mb-4 border-red-300 p-3 text-sm text-red-700 print:hidden">{error} <button className="underline" onClick={reload}>Try again</button></p>}
      {loading && !data.expenses.length && !data.donations.length ? <p className="py-10 text-center text-burgundy/70" role="status">Loading finance records…</p> : children}
      {toast && <div role="status" className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm rounded-full bg-burgundy px-4 py-2 text-center text-sm text-gold-light shadow-royal md:bottom-6 print:hidden">{toast}</div>}
      {ask && <ReasonDialog ask={ask} onDone={(v) => { ask.resolve(v); setAsk(null); }} />}
    </FinContext.Provider>
  );
}

function ReasonDialog({ ask, onDone }: { ask: Ask; onDone: (v: string | null) => void }) {
  const [v, setV] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onDone(null); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);
  const ok = v.trim().length >= 3;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4 print:hidden" onMouseDown={(e) => { if (e.target === e.currentTarget) onDone(null); }}>
      <form role="dialog" aria-modal="true" aria-labelledby="reason-t" onSubmit={(e) => { e.preventDefault(); if (ok) onDone(v.trim()); }} className="royal-card w-full max-w-md space-y-3 p-5">
        <h2 id="reason-t" className="font-display text-lg font-bold text-burgundy">{ask.title}</h2>
        <label className="block text-sm">Reason (saved in the audit log)
          <textarea ref={ref} className="field mt-1 min-h-20" value={v} onChange={(e) => setV(e.target.value)} placeholder="e.g. Amount corrected as per bill" required minLength={3} />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => onDone(null)}>Cancel</button>
          <button className={ask.danger ? "rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" : "btn-royal"} disabled={!ok}>{ask.confirm}</button>
        </div>
      </form>
    </div>
  );
}
