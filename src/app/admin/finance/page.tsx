"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Amt, Bars, Badge, PageHead, Section, Stat, Table } from "@/components/finance/ui";
import { fmtDay, fyLabel, incomeRows, inYear, monthlySeries, money, sum, yearSummaries } from "@/lib/finance";
import { useFin } from "@/lib/useFinance";

export default function FinanceDashboard() {
  const { data, year, sm } = useFin();
  const ys = useMemo(() => yearSummaries(data), [data]);
  const sel = year === "all" ? null : ys.find((y) => y.year === year) ?? null;
  const prev = sel ? ys.find((y) => y.year === sel.year - 1) : undefined;
  const view = sel ?? (ys.length ? {
    year: 0, opening: ys[0].opening, donations: sum(ys.map((y) => y.donations)), auction: sum(ys.map((y) => y.auction)), sponsorCash: sum(ys.map((y) => y.sponsorCash)),
    income: sum(ys.map((y) => y.income)), expenses: sum(ys.map((y) => y.expenses)), surplus: sum(ys.map((y) => y.surplus)), closing: ys[ys.length - 1].closing,
    inKind: sum(ys.map((y) => y.inKind)), pendingAuction: sum(ys.map((y) => y.pendingAuction)), pendingSponsor: sum(ys.map((y) => y.pendingSponsor)), explicitOpening: true,
  } : null);

  const recent = useMemo(() => {
    const inc = inYear(incomeRows(data), (r) => r.date, year, sm).map((r) => ({ key: r.key, date: r.date, kind: r.source, text: r.label, amount: r.amount, out: false }));
    const exp = inYear(data.expenses, (e) => e.spent_on, year, sm).map((e) => ({ key: `x${e.id}`, date: e.spent_on, kind: "Expense", text: e.item, amount: e.amount, out: true }));
    return [...inc, ...exp].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  }, [data, year, sm]);

  if (!view) return <><PageHead title="Financial Dashboard" /><p className="royal-card p-8 text-center">No financial records yet. Start with <Link className="underline" href="/admin/finance/donations">Donations</Link> or <Link className="underline" href="/admin/finance/expenses">Expenses</Link>.</p></>;
  const label = sel ? `FY ${fyLabel(sel.year, sm)}` : "All years";

  return (
    <>
      <PageHead title="Financial Dashboard" blurb={`Cash position and sources for ${label}. Only money actually received or paid is counted; pending amounts are shown separately.`} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total income" value={money(view.income)} tone="good" hint="Cash received" />
        <Stat label="Total expenses" value={money(view.expenses)} />
        <Stat label="Surplus / deficit" value={money(view.surplus)} tone={view.surplus < 0 ? "bad" : "good"} />
        <Stat label="Closing balance" value={money(view.closing)} tone={view.closing < 0 ? "bad" : undefined} hint={sel ? `Opening ${money(view.opening)}${sel.explicitOpening ? "" : " (carried forward)"}` : undefined} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Donations" value={money(view.donations)} /><Stat label="Auctions collected" value={money(view.auction)} /><Stat label="Cash sponsorships" value={money(view.sponsorCash)} />
        <Stat label="In-kind sponsorship" value={money(view.inKind)} hint="Value only, not cash" />
      </div>
      {(view.pendingAuction > 0 || view.pendingSponsor > 0) && (
        <p className="royal-card mt-3 border-amber-300 bg-amber-50 p-3 text-sm"><b>To be collected:</b> {money(view.pendingAuction)} from auctions and {money(view.pendingSponsor)} from sponsorships. These are not in income or the balance until received.</p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {sel && (
          <Section title={`Monthly income and expenses, ${fyLabel(sel.year, sm)}`}>
            <Bars series={monthlySeries(data, sel.year).map((m) => ({ label: m.label, a: m.income, b: m.expense }))} />
          </Section>
        )}
        {!sel && <Section title="Income and expenses by year"><Bars series={ys.map((y) => ({ label: fyLabel(y.year, sm), a: y.income, b: y.expenses }))} /></Section>}
        <Section title="Year-over-year" right={<Link href="/admin/finance/reports/year-wise" className="text-sm text-burgundy underline">Full comparison</Link>}>
          <Table head={["", ...ys.slice(-3).map((y) => fyLabel(y.year, sm))]} right={[1, 2, 3]} rows={[
            ["Income", ...ys.slice(-3).map((y) => <Amt key={y.year} v={y.income} />)], ["Expenses", ...ys.slice(-3).map((y) => <Amt key={y.year} v={y.expenses} />)],
            ["Surplus", ...ys.slice(-3).map((y) => <Amt key={y.year} v={y.surplus} signed />)], ["Closing balance", ...ys.slice(-3).map((y) => <Amt key={y.year} v={y.closing} signed />)],
          ]} />
          {sel && prev && prev.expenses > 0 && <p className="mt-2 text-xs text-burgundy/70">Spending is {Math.round(((sel.expenses - prev.expenses) / prev.expenses) * 100)}% versus {fyLabel(prev.year, sm)}.</p>}
        </Section>
      </div>

      <Section title="Recent transactions">
        <Table head={["Date", "Type", "Details", "Amount"]} right={[3]} empty="Nothing recorded for this period."
          rows={recent.map((r) => [fmtDay(r.date), <Badge key={r.key} tone={r.out ? "bad" : "good"}>{r.kind}</Badge>, <span key="t" className="font-telugu">{r.text}</span>, <span key="a" className={r.out ? "text-red-700" : "text-emerald-700"}>{r.out ? "−" : "+"}{money(r.amount)}</span>])} />
      </Section>
    </>
  );
}
