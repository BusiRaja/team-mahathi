"use client";

import Link from "next/link";
import Crud from "@/components/finance/Crud";
import { Amt, Badge, PageHead } from "@/components/finance/ui";
import { useOptions } from "@/components/finance/options";
import { fmtDay, money, pendingSponsorship, sum, today, type Sponsorship } from "@/lib/finance";
import { useFin } from "@/lib/useFinance";

const STATUS = [{ value: "pledged", label: "Pledged" }, { value: "partial", label: "Partly received" }, { value: "received", label: "Received" }, { value: "cancelled", label: "Cancelled" }];

export default function SponsorshipsPage() {
  const { data } = useFin();
  const o = useOptions();
  return (
    <>
      <PageHead title="Sponsorships" blurb="Cash sponsorships count as income only when received. In-kind sponsorships (flowers, sound, food…) are tracked by estimated value and are never added to cash." actions={<Link href="/admin/finance/reports/sponsors" className="btn-ghost">Manage sponsors</Link>} />
      <Crud<Sponsorship>
        table="fin_sponsorships" noun="sponsorship" title="Sponsorship records" exportName="team-mahathi-sponsorships" rows={data.sponsorships} dateKey="committed_on"
        blank={{ sponsor_id: "", kind: "cash", item: "", estimated_value: "", committed_on: today(), status: "pledged", received_amount: "0", received_on: "", payment_mode: "", event_id: "", notes: "" }}
        fields={[
          { key: "sponsor_id", label: "Sponsor", type: "select", options: o.sponsors, required: true, help: "Not listed? Add the sponsor first." },
          { key: "kind", label: "Type", type: "select", required: true, options: [{ value: "cash", label: "Cash" }, { value: "in_kind", label: "In-kind (goods or services)" }] },
          { key: "item", label: "Sponsored item or service", type: "text", required: true, placeholder: "e.g. Flex banners, Prasadam" },
          { key: "estimated_value", label: "Value / committed amount (₹)", type: "number", zero: true }, { key: "committed_on", label: "Date committed", type: "date", required: true },
          { key: "status", label: "Status", type: "select", required: true, options: STATUS }, { key: "event_id", label: "Event", type: "select", options: o.events },
          { key: "received_amount", label: "Cash received so far (₹)", type: "number", zero: true, showIf: (f) => f.kind === "cash" },
          { key: "received_on", label: "Received on", type: "date", showIf: (f) => f.kind === "cash" },
          { key: "payment_mode", label: "Payment mode", type: "select", options: o.modes, showIf: (f) => f.kind === "cash" }, { key: "notes", label: "Notes", type: "textarea" },
        ]}
        validate={(f) => (f.kind === "cash" && f.status === "received" && Number(f.received_amount || 0) <= 0 ? "Enter the cash amount received, or set the status to Pledged" : null)}
        normalize={(p) => (p.kind === "in_kind" ? { ...p, received_amount: 0, received_on: null, payment_mode: null } : p)}
        search={(r) => `${o.nameOf.sponsor(r.sponsor_id)} ${r.item} ${r.notes ?? ""}`}
        filters={[{ label: "Type", options: [{ value: "cash", label: "Cash" }, { value: "in_kind", label: "In-kind" }], test: (r, v) => r.kind === v }, { label: "Status", options: STATUS, test: (r, v) => r.status === v }]}
        stats={(r) => {
          const live = r.filter((x) => x.status !== "cancelled");
          return [
            { label: "Cash received", value: money(sum(live.filter((x) => x.kind === "cash").map((x) => x.received_amount))), tone: "good" },
            { label: "Cash still due", value: money(sum(live.map(pendingSponsorship))), tone: sum(live.map(pendingSponsorship)) > 0 ? "bad" : undefined },
            { label: "In-kind value", value: money(sum(live.filter((x) => x.kind === "in_kind").map((x) => x.estimated_value))), hint: "Not cash" }, { label: "Sponsorships", value: String(live.length) },
          ];
        }}
        cols={[
          { label: "Sponsor", cell: (r) => <><span className="font-medium">{o.nameOf.sponsor(r.sponsor_id)}</span><span className="block text-xs text-burgundy/60">{fmtDay(r.committed_on)}</span></>, csv: (r) => o.nameOf.sponsor(r.sponsor_id) },
          { label: "Type", cell: (r) => <Badge tone={r.kind === "cash" ? "good" : "plain"}>{r.kind === "cash" ? "Cash" : "In-kind"}</Badge>, csv: (r) => (r.kind === "cash" ? "Cash" : "In-kind") },
          { label: "Item / service", cell: (r) => <span className="font-telugu">{r.item}</span>, csv: (r) => r.item },
          { label: "Value", right: true, cell: (r) => <Amt v={r.estimated_value} />, csv: (r) => r.estimated_value },
          { label: "Cash received", right: true, cell: (r) => (r.kind === "cash" ? <Amt v={r.received_amount} /> : "—"), csv: (r) => (r.kind === "cash" ? r.received_amount : "") },
          { label: "Still due", right: true, cell: (r) => (pendingSponsorship(r) > 0 ? <Badge tone="warn">{money(pendingSponsorship(r))}</Badge> : "—"), csv: (r) => pendingSponsorship(r) },
          { label: "Status", cell: (r) => <Badge tone={r.status === "received" ? "good" : r.status === "cancelled" ? "bad" : "warn"}>{STATUS.find((s) => s.value === r.status)?.label}</Badge>, csv: (r) => r.status },
        ]}
        describe={(r) => `${r.item} by ${o.nameOf.sponsor(r.sponsor_id)}`}
      />
    </>
  );
}
