"use client";

import { Fragment, useMemo, useState } from "react";
import { Amt, Badge, PageHead, Section, Stat, Table } from "@/components/finance/ui";
import { downloadCsv, eventFinancials, fmtDay, fyOf, incomeRows, money, sum } from "@/lib/finance";
import { useFin } from "@/lib/useFinance";

export default function EventBudgetsPage() {
  const { data, year, sm, save, askReason, say } = useFin();
  const rows = useMemo(() => eventFinancials(data, year), [data, year]);
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const saveBudget = async (eventId: string) => {
    const raw = draft[eventId]; if (raw === undefined || raw === "" || Number(raw) < 0) return say("Enter a budget of zero or more");
    const existing = data.budgets.find((b) => b.event_id === eventId);
    let reason: string | null = null;
    if (existing) { reason = await askReason({ title: "Change this event budget?", confirm: "Save budget" }); if (!reason) return; }
    const err = await save("fin_event_budgets", existing?.id ?? null, existing ? { budget: Number(raw) } : { event_id: eventId, budget: Number(raw) }, reason);
    if (err) return say(err);
    setDraft((d) => { const n = { ...d }; delete n[eventId]; return n; }); say("Budget saved");
  };

  const real = rows.filter((r) => r.event_id);
  const tot = { budget: sum(real.map((r) => r.budget ?? 0)), spent: sum(real.filter((r) => r.budget != null).map((r) => r.expenses)) };
  const detail = (id: string | null) => {
    const inc = incomeRows(data).filter((r) => r.event_id === id && (year === "all" || fyOf(r.date, sm) === year));
    const exp = data.expenses.filter((e) => e.event_id === id && (year === "all" || fyOf(e.spent_on, sm) === year));
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div><h4 className="mb-1 text-sm font-semibold text-burgundy">Income</h4><Table head={["Date", "Source", "Amount"]} right={[2]} empty="No income linked." rows={inc.map((r) => [fmtDay(r.date), `${r.source}: ${r.label}`, <Amt key={r.key} v={r.amount} />])} /></div>
        <div><h4 className="mb-1 text-sm font-semibold text-burgundy">Expenses</h4><Table head={["Date", "Item", "Amount"]} right={[2]} empty="No expenses linked." rows={exp.map((e) => [fmtDay(e.spent_on), e.item, <Amt key={e.id} v={e.amount} />])} /></div>
      </div>
    );
  };

  return (
    <>
      <PageHead title="Events & Budgets" blurb="Set a budget per event and compare it with what was actually spent. Link donations, auctions, sponsorships and expenses to an event from their own pages."
        actions={<button className="btn-ghost" onClick={() => downloadCsv("team-mahathi-event-wise", ["Event", "Budget", "Donations", "Auction", "Cash sponsorship", "Total income", "Expenses", "Surplus/deficit", "Budget left", "In-kind value"], rows.map((r) => [r.title, r.budget ?? "", r.donations, r.auction, r.sponsorCash, r.income, r.expenses, r.surplus, r.variance ?? "", r.inKind]))}>Download CSV</button>} />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Budgeted events" value={String(real.filter((r) => r.budget != null).length)} /><Stat label="Total budget" value={money(tot.budget)} />
        <Stat label="Spent on those events" value={money(tot.spent)} /><Stat label="Budget left" value={money(tot.budget - tot.spent)} tone={tot.budget - tot.spent < 0 ? "bad" : "good"} />
      </div>
      <Section title="Budget versus actual">
        {data.events.length === 0 && <p className="mb-3 text-sm text-burgundy/70">No events yet. Add events in the Admin panel → Events, then set budgets here.</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead className="bg-blush text-burgundy"><tr>{["Event", "Budget (₹)", "Spent", "Budget left", "Income", "Surplus / deficit", ""].map((h, i) => <th key={h + i} scope="col" className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${i > 0 && i < 6 ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gold/20">
              {rows.map((r) => {
                const id = r.event_id, key = id ?? "general";
                return (
                  <Fragment key={key}>
                    <tr>
                      <td className="px-3 py-2 font-telugu font-medium">{r.title}{r.inKind > 0 && <span className="block text-xs font-normal text-burgundy/60">In-kind: {money(r.inKind)}</span>}</td>
                      <td className="px-3 py-2 text-right">
                        {id ? (
                          <span className="inline-flex items-center gap-1 print:hidden">
                            <input aria-label={`Budget for ${r.title}`} className="field !w-28 !py-1 text-right" type="number" min={0} step="0.01" value={draft[id] ?? (r.budget ?? "")} onChange={(e) => setDraft({ ...draft, [id]: e.target.value })} />
                            {draft[id] !== undefined && <button className="btn-royal !px-3 !py-1 !text-xs" onClick={() => saveBudget(id)}>Save</button>}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right"><Amt v={r.expenses} /></td>
                      <td className="px-3 py-2 text-right">{r.variance == null ? <Badge>No budget</Badge> : <span className={r.variance < 0 ? "font-semibold text-red-700" : ""}><Amt v={r.variance} signed /></span>}</td>
                      <td className="px-3 py-2 text-right"><Amt v={r.income} /></td>
                      <td className="px-3 py-2 text-right"><Amt v={r.surplus} signed /></td>
                      <td className="px-3 py-2 text-right print:hidden"><button className="rounded-full border border-burgundy/40 px-3 py-1 text-xs" aria-expanded={open === key} onClick={() => setOpen(open === key ? null : key)}>{open === key ? "Hide" : "Details"}</button></td>
                    </tr>
                    {open === key && <tr><td colSpan={7} className="bg-ivory px-3 py-3">{detail(id)}</td></tr>}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && <p className="py-6 text-center text-sm text-burgundy/70">No event activity for this year yet.</p>}
      </Section>
    </>
  );
}
