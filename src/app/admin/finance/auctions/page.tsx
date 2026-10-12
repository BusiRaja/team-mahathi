"use client";

import Crud from "@/components/finance/Crud";
import { Amt, Badge, PageHead, Table } from "@/components/finance/ui";
import { useOptions } from "@/components/finance/options";
import { fmtDay, money, pendingAuction, sum, today, type Lot } from "@/lib/finance";
import { useFin } from "@/lib/useFinance";

export default function AuctionsPage() {
  const { data } = useFin();
  const o = useOptions();
  const names = [...new Set(data.lots.map((l) => l.auction_name))];
  return (
    <>
      <PageHead title="Auctions" blurb="One row per lot. Income counts only what has been collected; the unpaid balance is shown as pending and is never added to income." />
      <Crud<Lot>
        table="fin_auction_lots" noun="auction lot" title="Auction lots" exportName="team-mahathi-auctions" rows={data.lots} dateKey="auction_date"
        blank={{ auction_name: "", auction_date: today(), event_id: "", lot_name: "", description: "", winning_bidder: "", bidder_phone: "", final_bid: "", amount_collected: "0", collected_on: "", payment_mode: "", notes: "" }}
        fields={[
          { key: "auction_name", label: "Auction", type: "text", required: true, suggest: names, placeholder: "e.g. Laddu Auction 2026" },
          { key: "auction_date", label: "Auction date", type: "date", required: true }, { key: "event_id", label: "Event", type: "select", options: o.events },
          { key: "lot_name", label: "Item / lot", type: "text", required: true }, { key: "winning_bidder", label: "Winning bidder", type: "text" }, { key: "bidder_phone", label: "Bidder phone", type: "tel" },
          { key: "final_bid", label: "Final bid (₹)", type: "number", required: true }, { key: "amount_collected", label: "Amount collected (₹)", type: "number", zero: true },
          { key: "collected_on", label: "Collected on", type: "date", help: "Leave blank to use the auction date" },
          { key: "payment_mode", label: "Payment mode", type: "select", options: o.modes }, { key: "description", label: "Lot details", type: "textarea" }, { key: "notes", label: "Notes", type: "textarea" },
        ]}
        validate={(f) => (Number(f.amount_collected || 0) > Number(f.final_bid || 0) ? "Amount collected cannot be more than the final bid" : null)}
        search={(r) => `${r.auction_name} ${r.lot_name} ${r.winning_bidder ?? ""} ${r.description ?? ""}`}
        filters={[{ label: "Auction", options: names.map((n) => ({ value: n, label: n })), test: (r, v) => r.auction_name === v }, { label: "Payment", options: [{ value: "pending", label: "Has pending amount" }, { value: "paid", label: "Fully paid" }], test: (r, v) => (v === "pending" ? pendingAuction(r) > 0 : pendingAuction(r) === 0) }]}
        stats={(r) => [
          { label: "Total bids", value: money(sum(r.map((x) => x.final_bid))) }, { label: "Collected (income)", value: money(sum(r.map((x) => x.amount_collected))), tone: "good" },
          { label: "Pending", value: money(sum(r.map(pendingAuction))), tone: sum(r.map(pendingAuction)) > 0 ? "bad" : undefined }, { label: "Lots", value: String(r.length) },
        ]}
        cols={[
          { label: "Auction", cell: (r) => <><span className="font-medium">{r.auction_name}</span><span className="block text-xs text-burgundy/60">{fmtDay(r.auction_date)}</span></>, csv: (r) => `${r.auction_name} (${r.auction_date})` },
          { label: "Lot", cell: (r) => <span className="font-telugu">{r.lot_name}</span>, csv: (r) => r.lot_name },
          { label: "Winning bidder", cell: (r) => r.winning_bidder ? <>{r.winning_bidder}{r.bidder_phone && <span className="block text-xs text-burgundy/60">{r.bidder_phone}</span>}</> : "—", csv: (r) => r.winning_bidder ?? "" },
          { label: "Final bid", right: true, cell: (r) => <Amt v={r.final_bid} />, csv: (r) => r.final_bid },
          { label: "Collected", right: true, cell: (r) => <Amt v={r.amount_collected} />, csv: (r) => r.amount_collected },
          { label: "Pending", right: true, cell: (r) => (pendingAuction(r) > 0 ? <Badge tone="warn">{money(pendingAuction(r))}</Badge> : <Badge tone="good">Paid</Badge>), csv: (r) => pendingAuction(r) },
        ]}
        describe={(r) => `${r.lot_name} (${money(r.final_bid)})`}
        footer={(rows) => {
          const by = new Map<string, { bid: number; got: number; n: number }>();
          for (const r of rows) { const c = by.get(r.auction_name) ?? { bid: 0, got: 0, n: 0 }; by.set(r.auction_name, { bid: sum([c.bid, r.final_bid]), got: sum([c.got, r.amount_collected]), n: c.n + 1 }); }
          return <><h3 className="mb-2 font-semibold text-burgundy">Auction-wise totals</h3><Table head={["Auction", "Lots", "Total bids", "Collected", "Pending"]} right={[1, 2, 3, 4]} rows={[...by.entries()].map(([k, v]) => [k, v.n, <Amt key="a" v={v.bid} />, <Amt key="b" v={v.got} />, <Amt key="c" v={sum([v.bid]) - v.got} />])} /></>;
        }}
      />
    </>
  );
}
