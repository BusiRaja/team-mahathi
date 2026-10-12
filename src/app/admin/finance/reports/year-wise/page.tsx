"use client";

import { useMemo } from "react";
import { Amt, Bars, Badge, PageHead, PrintButton, Section, Table } from "@/components/finance/ui";
import { downloadCsv, fyLabel, yearSummaries } from "@/lib/finance";
import { useFin } from "@/lib/useFinance";

export default function YearWisePage() {
  const { data, year, sm } = useFin();
  const ys = useMemo(() => yearSummaries(data), [data]);
  const metrics: [string, keyof (typeof ys)[number], boolean?][] = [
    ["Opening balance", "opening"], ["Donations", "donations"], ["Auctions collected", "auction"], ["Cash sponsorships", "sponsorCash"], ["Total income", "income"],
    ["Total expenses", "expenses"], ["Surplus / deficit", "surplus", true], ["Closing balance", "closing", true], ["In-kind sponsorship (not cash)", "inKind"],
    ["Auction amount pending", "pendingAuction"], ["Sponsorship amount pending", "pendingSponsor"],
  ];
  const cols = [...ys].reverse();
  return (
    <>
      <PageHead title="Year-wise Financial Summary" blurb="Compare every year side by side. A year with no opening balance entered starts from the previous year's closing balance."
        actions={<><button className="btn-ghost" disabled={!ys.length} onClick={() => downloadCsv("team-mahathi-year-wise", ["Metric", ...cols.map((y) => fyLabel(y.year, sm))], metrics.map(([l, k]) => [l, ...cols.map((y) => y[k])]))}>Download CSV</button><PrintButton /></>} />
      {!ys.length ? <p className="royal-card p-8 text-center">No records yet.</p> : (
        <>
          <Section title="Income and expenses by year"><Bars series={ys.map((y) => ({ label: fyLabel(y.year, sm), a: y.income, b: y.expenses }))} /></Section>
          <Section title="Comparison">
            <Table head={["", ...cols.map((y) => fyLabel(y.year, sm) + (y.year === year ? " ●" : ""))]} right={cols.map((_, i) => i + 1)}
              rows={metrics.map(([l, k, signed]) => [<span key={l} className={k === "income" || k === "expenses" || k === "closing" ? "font-semibold" : ""}>{l}</span>, ...cols.map((y) => <Amt key={y.year} v={y[k] as number} signed={signed} />)])} />
            <p className="mt-3 flex flex-wrap gap-2 text-xs text-burgundy/70">{cols.map((y) => <Badge key={y.year} tone={y.explicitOpening ? "plain" : "warn"}>{fyLabel(y.year, sm)}: {y.explicitOpening ? "opening entered by you" : "opening carried forward"}</Badge>)}</p>
          </Section>
        </>
      )}
    </>
  );
}
