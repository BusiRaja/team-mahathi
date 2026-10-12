"use client";

import { useMemo, useState } from "react";
import { Amt, PageHead, Section, Table } from "@/components/finance/ui";
import { useOptions } from "@/components/finance/options";
import { categoryTotals, downloadCsv, eventFinancials, fmtDay, fyLabel, fyOf, incomeRows, inYear, pendingAuction, pendingSponsorship, sum, today, yearSummaries } from "@/lib/finance";
import { useFin } from "@/lib/useFinance";

type DatasetKey = "ledger" | "expenses" | "donations" | "auctions" | "sponsorships" | "events" | "years";
const DATASETS: [DatasetKey, string][] = [["ledger", "All transactions (ledger)"], ["expenses", "Expenses"], ["donations", "Donations"], ["auctions", "Auction lots"], ["sponsorships", "Sponsorships"], ["events", "Event-wise summary"], ["years", "Year-wise summary"]];

export default function ExportPage() {
  const { data, year, sm } = useFin();
  const o = useOptions();
  const [ds, setDs] = useState<DatasetKey>("ledger");
  const [mode, setMode] = useState<"data" | "statement">("data");
  const [stmtEvent, setStmtEvent] = useState("");
  const ys = useMemo(() => yearSummaries(data), [data]);
  const yl = year === "all" ? "all-years" : fyLabel(year, sm);

  const built = useMemo(() => {
    const exp = inYear(data.expenses, (e) => e.spent_on, year, sm), don = inYear(data.donations, (d) => d.received_on, year, sm);
    const lots = inYear(data.lots, (l) => l.auction_date, year, sm), sp = inYear(data.sponsorships, (s) => s.committed_on, year, sm);
    switch (ds) {
      case "expenses": return { header: ["Date", "Item", "Category", "Event", "Vendor", "Payment mode", "Amount", "Receipt link"], rows: exp.map((e) => [e.spent_on, e.item, o.nameOf.category(e.category_id), o.nameOf.event(e.event_id), e.vendor ?? "", e.payment_mode ?? "", e.amount, e.receipt_url ?? ""]) };
      case "donations": return { header: ["Date", "Donor", "Amount", "Payment mode", "Receipt no.", "Event"], rows: don.map((d) => [d.received_on, d.anonymous ? "Anonymous" : o.nameOf.donor(d.donor_id), d.amount, d.payment_mode ?? "", d.receipt_no ?? "", o.nameOf.event(d.event_id)]) };
      case "auctions": return { header: ["Auction", "Auction date", "Lot", "Winning bidder", "Final bid", "Collected", "Pending", "Collected on"], rows: lots.map((l) => [l.auction_name, l.auction_date, l.lot_name, l.winning_bidder ?? "", l.final_bid, l.amount_collected, pendingAuction(l), l.collected_on ?? ""]) };
      case "sponsorships": return { header: ["Date committed", "Sponsor", "Type", "Item", "Value", "Cash received", "Still due", "Status"], rows: sp.map((s) => [s.committed_on, o.nameOf.sponsor(s.sponsor_id), s.kind === "cash" ? "Cash" : "In-kind", s.item, s.estimated_value, s.received_amount, pendingSponsorship(s), s.status]) };
      case "events": return { header: ["Event", "Budget", "Donations", "Auctions", "Cash sponsorship", "Total income", "Expenses", "Surplus / deficit", "Budget left", "In-kind value"], rows: eventFinancials(data, year).map((r) => [r.title, r.budget ?? "", r.donations, r.auction, r.sponsorCash, r.income, r.expenses, r.surplus, r.variance ?? "", r.inKind]) };
      case "years": return { header: ["Year", "Opening", "Donations", "Auctions", "Cash sponsorship", "Total income", "Expenses", "Surplus", "Closing", "In-kind", "Auction pending", "Sponsorship pending"], rows: ys.map((y) => [fyLabel(y.year, sm), y.opening, y.donations, y.auction, y.sponsorCash, y.income, y.expenses, y.surplus, y.closing, y.inKind, y.pendingAuction, y.pendingSponsor]) };
      default: {
        const lines = [...incomeRows(data).filter((r) => year === "all" || fyOf(r.date, sm) === year).map((r) => ({ date: r.date, type: "Income", head: r.source, text: r.label, ev: r.event_id, inc: r.amount, out: 0 })),
          ...exp.map((e) => ({ date: e.spent_on, type: "Expense", head: o.nameOf.category(e.category_id), text: e.item, ev: e.event_id, inc: 0, out: e.amount }))].sort((a, b) => a.date.localeCompare(b.date));
        const single = year !== "all"; let bal = single ? ys.find((y) => y.year === year)?.opening ?? 0 : 0;
        return { header: ["Date", "Type", "Head", "Details", "Event", "Income", "Expense", ...(single ? ["Balance"] : [])], rows: lines.map((l) => { bal = Math.round((bal + l.inc - l.out) * 100) / 100; return [l.date, l.type, l.head, l.text, o.nameOf.event(l.ev), l.inc || "", l.out || "", ...(single ? [bal] : [])]; }) };
      }
    }
  }, [data, ds, year, sm, ys, o]); // eslint-disable-line react-hooks/exhaustive-deps

  const sum_ = year === "all" ? null : ys.find((y) => y.year === year);
  const expYear = inYear(data.expenses, (e) => e.spent_on, year, sm);
  const evFin = stmtEvent ? eventFinancials(data, "all").find((e) => e.event_id === stmtEvent) : null;
  const evExp = data.expenses.filter((e) => e.event_id === stmtEvent);
  const doPrint = (m: "data" | "statement") => { setMode(m); setTimeout(() => window.print(), 60); };

  return (
    <>
      <PageHead title="Export & Financial Statements" blurb="Download any list as CSV (opens in Excel or Google Sheets) or print a statement. In the print window choose “Save as PDF” to make a PDF." />
      <div className={mode === "statement" ? "print:hidden" : ""}>
        <Section title="Download data" right={<div className="flex flex-wrap gap-2 print:hidden">
          <select className="field !w-auto" aria-label="What to export" value={ds} onChange={(e) => setDs(e.target.value as DatasetKey)}>{DATASETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <button className="btn-royal" disabled={!built.rows.length} onClick={() => downloadCsv(`team-mahathi-${ds}-${yl}`, built.header, built.rows)}>Download CSV</button>
          <button className="btn-ghost" disabled={!built.rows.length} onClick={() => doPrint("data")}>Print / Save as PDF</button></div>}>
          <p className="mb-3 text-sm text-burgundy/70">{DATASETS.find(([k]) => k === ds)?.[1]} · {year === "all" ? "all years" : `FY ${fyLabel(year, sm)}`} · {built.rows.length} row{built.rows.length === 1 ? "" : "s"}. The table below is exactly what is exported.</p>
          <Table head={built.header} rows={built.rows.slice(0, 200).map((r) => r.map((c) => (typeof c === "number" ? <span className="tabular-nums">{c.toLocaleString("en-IN")}</span> : String(c))))} right={built.header.map((h, i) => (/Amount|Income|Expense|Balance|Budget|Bid|Collected|Pending|Opening|Closing|Surplus|Value|Total|received|due|Donations|Auctions|sponsorship/i.test(h) ? i : -1)).filter((i) => i >= 0)} empty="Nothing to export for this selection." />
          {built.rows.length > 200 && <p className="mt-2 text-xs text-burgundy/60">Preview shows the first 200 rows. The download contains all {built.rows.length}.</p>}
        </Section>
      </div>

      <div className={mode === "data" ? "print:hidden" : ""}>
        <Section title="Printable statements" right={<div className="flex flex-wrap gap-2 print:hidden"><select className="field !w-auto" aria-label="Event for event statement" value={stmtEvent} onChange={(e) => setStmtEvent(e.target.value)}><option value="">Annual statement</option>{o.events.map((e) => <option key={e.value} value={e.value}>Event: {e.label}</option>)}</select><button className="btn-royal" onClick={() => doPrint("statement")}>Print / Save as PDF</button></div>}>
          <div className="mx-auto max-w-2xl rounded-xl border border-gold/40 bg-white p-6 print:border-0 print:p-0">
            <header className="mb-4 border-b-2 border-burgundy pb-3 text-center">
              <h2 className="font-display text-2xl font-bold text-burgundy">Team Mahathi, Gajwel</h2>
              <p className="text-sm">{stmtEvent && evFin ? `Event financial statement: ${evFin.title}` : year === "all" ? "Financial statement (all years)" : `Annual financial statement, FY ${fyLabel(year, sm)}`}</p>
              <p className="text-xs text-burgundy/60">Prepared on {fmtDay(today())}</p>
            </header>
            {stmtEvent && evFin ? (
              <Table head={["Particulars", "Amount"]} right={[1]} rows={[
                ["Budget", evFin.budget == null ? "Not set" : <Amt key="b" v={evFin.budget} />], ["Donations", <Amt key="1" v={evFin.donations} />], ["Auctions collected", <Amt key="2" v={evFin.auction} />], ["Cash sponsorships", <Amt key="3" v={evFin.sponsorCash} />],
                [<b key="ti">Total income</b>, <b key="tia"><Amt v={evFin.income} /></b>],
                ...categoryTotals(data, evExp).map((c) => [`Expense: ${c.name}`, <Amt key={c.name} v={c.total} />]), [<b key="te">Total expenses</b>, <b key="tea"><Amt v={evFin.expenses} /></b>],
                [<b key="s">Surplus / (deficit)</b>, <b key="sa"><Amt v={evFin.surplus} signed /></b>], ...(evFin.variance != null ? [["Budget left / (over budget)", <Amt key="v" v={evFin.variance} signed />]] : []), ["In-kind sponsorship (not cash)", <Amt key="k" v={evFin.inKind} />],
              ]} />
            ) : sum_ ? (
              <Table head={["Particulars", "Amount"]} right={[1]} rows={[
                [<b key="o">Opening balance</b>, <Amt key="oa" v={sum_.opening} />],
                ["Receipts: donations", <Amt key="1" v={sum_.donations} />], ["Receipts: auctions collected", <Amt key="2" v={sum_.auction} />], ["Receipts: cash sponsorships", <Amt key="3" v={sum_.sponsorCash} />],
                [<b key="ti">Total receipts</b>, <b key="tia"><Amt v={sum_.income} /></b>],
                ...categoryTotals(data, expYear).map((c) => [`Payments: ${c.name}`, <Amt key={c.name} v={c.total} />]), [<b key="te">Total payments</b>, <b key="tea"><Amt v={sum_.expenses} /></b>],
                [<b key="cb">Closing balance</b>, <b key="cba"><Amt v={sum_.closing} signed /></b>],
                ["Memo: in-kind sponsorship received (not cash)", <Amt key="k" v={sum_.inKind} />], ["Memo: auction amount still to collect", <Amt key="p1" v={sum_.pendingAuction} />], ["Memo: sponsorship amount still to collect", <Amt key="p2" v={sum_.pendingSponsor} />],
              ]} />
            ) : <p className="py-4 text-sm text-burgundy/70">Choose a single financial year at the top of the page for an annual statement, or pick an event.</p>}
            <p className="mt-4 text-xs text-burgundy/60">Receipts and payments are shown on a cash basis. Pending amounts and in-kind values are memo items and are not part of the balance.</p>
          </div>
        </Section>
      </div>
    </>
  );
}
