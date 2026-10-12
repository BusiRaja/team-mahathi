"use client";

import { useMemo } from "react";
import { Amt, Bars, PageHead, Section, ShareBars, Table } from "@/components/finance/ui";
import { categoryTotals, dayGroups, fmtDay, fyLabel, fyOf, monthlySeries, observations, sum, yearSummaries } from "@/lib/finance";
import { useFin } from "@/lib/useFinance";

export default function InsightsPage() {
  const { data, year, sm } = useFin();
  const ys = useMemo(() => yearSummaries(data), [data]);
  const y = year === "all" ? ys[ys.length - 1]?.year : year;
  const cur = ys.find((s) => s.year === y);
  const exp = useMemo(() => data.expenses.filter((e) => fyOf(e.spent_on, sm) === y), [data, sm, y]);
  const days = useMemo(() => [...dayGroups(data, exp)].sort((a, b) => b.total - a.total).slice(0, 5), [data, exp]);
  if (!cur || y == null) return <><PageHead title="Financial Insights" /><p className="royal-card p-8 text-center">Add some records to see insights.</p></>;
  const sources = [{ label: "Donations", value: cur.donations }, { label: "Auctions collected", value: cur.auction }, { label: "Cash sponsorships", value: cur.sponsorCash }].filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
  const cats = categoryTotals(data, exp);
  return (
    <>
      <PageHead title="Financial Insights" blurb={`Trends and observations for FY ${fyLabel(y, sm)}. These are rule-based checks on your own records, not forecasts.${year === "all" ? " Showing the latest year." : ""}`} />
      <Section title="What stands out"><ul className="list-disc space-y-1.5 pl-5 text-sm">{observations(data, y).map((t) => <li key={t}>{t}</li>)}</ul></Section>
      <Section title="Monthly trend"><Bars series={monthlySeries(data, y).map((m) => ({ label: m.label, a: m.income, b: m.expense }))} /></Section>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Largest income sources"><ShareBars rows={sources} total={cur.income} /></Section>
        <Section title="Expense categories"><ShareBars rows={cats.map((c) => ({ label: c.name, value: c.total }))} total={cur.expenses} /></Section>
      </div>
      <Section title="Highest-spending days">
        <Table head={["Date", "Entries", "Biggest item", "Day total"]} right={[1, 3]} empty="No expenses yet."
          rows={days.map((d) => [fmtDay(d.date), d.items.length, <span key="i" className="font-telugu">{[...d.items].sort((a, b) => b.amount - a.amount)[0].item}</span>, <Amt key="t" v={d.total} />])} />
        {sum(days.map((d) => d.total)) > 0 && cur.expenses > 0 && <p className="mt-2 text-xs text-burgundy/70">These five days make up {Math.round((sum(days.map((d) => d.total)) / cur.expenses) * 100)}% of the year&apos;s spending.</p>}
      </Section>
    </>
  );
}
