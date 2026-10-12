"use client";

import { Fragment, useMemo, useState } from "react";
import { Amt, PageHead, PrintButton, Section, ShareBars, Stat } from "@/components/finance/ui";
import { categoryTotals, dayGroups, downloadCsv, fmtDay, fyMonths, fyOf, MONTHS, money, monthOf, sum } from "@/lib/finance";
import { useFin } from "@/lib/useFinance";

export default function DayWisePage() {
  const { data, year, sm } = useFin();
  const [month, setMonth] = useState("all");
  const exp = useMemo(() => data.expenses.filter((e) => (year === "all" || fyOf(e.spent_on, sm) === year) && (month === "all" || monthOf(e.spent_on) === Number(month))), [data, year, sm, month]);
  const days = useMemo(() => dayGroups(data, exp), [data, exp]);
  const total = sum(exp.map((e) => e.amount));
  const cats = categoryTotals(data, exp);
  const monthTotals = useMemo(() => { const m = new Map<string, number>(); for (const e of exp) { const k = e.spent_on.slice(0, 7); m.set(k, sum([m.get(k) ?? 0, e.amount])); } return m; }, [exp]);
  const top = days.length ? [...days].sort((a, b) => b.total - a.total)[0] : null;

  return (
    <>
      <PageHead title="Day-wise Expense Report" blurb="Every expense grouped by date, with the day's total and a subtotal for each month."
        actions={<><select className="field !w-auto" aria-label="Month" value={month} onChange={(e) => setMonth(e.target.value)}><option value="all">All months</option>{fyMonths(sm).map((m) => <option key={m} value={m}>{MONTHS[m - 1]}</option>)}</select>
          <button className="btn-ghost" disabled={!exp.length} onClick={() => downloadCsv("team-mahathi-day-wise-expenses", ["Date", "Item", "Category", "Vendor", "Payment mode", "Amount", "Day total"], days.flatMap((d) => d.items.map((i, idx) => [d.date, i.item, i.category, i.vendor ?? "", i.payment_mode ?? "", i.amount, idx === 0 ? d.total : ""])))}>Download CSV</button><PrintButton /></>} />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total spent" value={money(total)} /><Stat label="Days with spending" value={String(days.length)} />
        <Stat label="Average per day" value={money(days.length ? total / days.length : 0)} /><Stat label="Highest day" value={top ? money(top.total) : "—"} hint={top ? fmtDay(top.date) : undefined} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Section title="Expenses by day">
          {!days.length && <p className="py-6 text-center text-sm text-burgundy/70">No expenses for this selection.</p>}
          {days.map((d, i) => {
            const mk = d.date.slice(0, 7), newMonth = i === 0 || days[i - 1].date.slice(0, 7) !== mk;
            return (
              <Fragment key={d.date}>
                {newMonth && <h3 className="mb-2 mt-4 flex justify-between border-b-2 border-gold/50 pb-1 font-display text-base font-bold text-burgundy first:mt-0"><span>{MONTHS[monthOf(d.date) - 1]} {d.date.slice(0, 4)}</span><span>Month total <Amt v={monthTotals.get(mk) ?? 0} /></span></h3>}
                <div className="mb-3 rounded-xl border border-gold/30">
                  <div className="flex justify-between bg-blush px-3 py-1.5 text-sm font-semibold text-burgundy"><span>{fmtDay(d.date)}</span><span>Day total <Amt v={d.total} /></span></div>
                  <ul className="divide-y divide-gold/20 text-sm">
                    {d.items.map((it) => <li key={it.id} className="flex justify-between gap-3 px-3 py-1.5"><span><span className="font-telugu">{it.item}</span><span className="ml-2 text-xs text-burgundy/60">{it.category}{it.vendor ? ` · ${it.vendor}` : ""}</span></span><Amt v={it.amount} /></li>)}
                  </ul>
                </div>
              </Fragment>
            );
          })}
        </Section>
        <Section title="Category totals"><ShareBars rows={cats.map((c) => ({ label: c.name, value: c.total }))} total={total} /></Section>
      </div>
    </>
  );
}
