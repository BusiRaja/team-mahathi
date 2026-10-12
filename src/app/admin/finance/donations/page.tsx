"use client";

import Link from "next/link";
import Crud from "@/components/finance/Crud";
import { Amt, Badge, PageHead, Table } from "@/components/finance/ui";
import { useOptions } from "@/components/finance/options";
import { fmtDay, MONTHS, money, monthOf, sum, today, type Donation } from "@/lib/finance";
import { useFin } from "@/lib/useFinance";

export default function DonationsPage() {
  const { data } = useFin();
  const o = useOptions();
  const donor = (r: Donation) => (r.anonymous ? "Anonymous" : o.nameOf.donor(r.donor_id));
  return (
    <>
      <PageHead title="Donations" blurb="Record donations received. New donors are added in Reports → Donors, where contact details are kept." actions={<Link href="/admin/finance/reports/donors" className="btn-ghost">Manage donors</Link>} />
      <Crud<Donation>
        table="fin_donations" noun="donation" title="Donation records" exportName="team-mahathi-donations" rows={data.donations} dateKey="received_on"
        blank={{ received_on: today(), anonymous: false, donor_id: "", amount: "", payment_mode: "", event_id: "", receipt_no: "", notes: "" }}
        fields={[
          { key: "received_on", label: "Date received", type: "date", required: true }, { key: "amount", label: "Amount (₹)", type: "number", required: true },
          { key: "anonymous", label: "Anonymous donation", type: "checkbox" },
          { key: "donor_id", label: "Donor", type: "select", options: o.donors, required: true, showIf: (f) => !f.anonymous, help: "Not listed? Add the donor first." },
          { key: "payment_mode", label: "Payment mode", type: "select", options: o.modes }, { key: "event_id", label: "Event", type: "select", options: o.events },
          { key: "receipt_no", label: "Receipt number", type: "text" }, { key: "notes", label: "Notes", type: "textarea" },
        ]}
        validate={(f) => (Number(f.amount) <= 0 ? "Amount must be more than zero" : null)}
        normalize={(p) => (p.anonymous ? { ...p, donor_id: null } : p)}
        search={(r) => `${donor(r)} ${r.receipt_no ?? ""} ${r.notes ?? ""}`}
        filters={[{ label: "Payment mode", options: o.modes, test: (r, v) => r.payment_mode === v }, { label: "Event", options: o.events, test: (r, v) => r.event_id === v }]}
        stats={(r) => [
          { label: "Total donations", value: money(sum(r.map((x) => x.amount))), tone: "good" }, { label: "Donations", value: String(r.length) },
          { label: "Anonymous", value: money(sum(r.filter((x) => x.anonymous).map((x) => x.amount))) },
          { label: "Largest", value: money(Math.max(0, ...r.map((x) => x.amount))) },
        ]}
        cols={[
          { label: "Date", cell: (r) => fmtDay(r.received_on), csv: (r) => r.received_on },
          { label: "Donor", cell: (r) => (r.anonymous ? <Badge>Anonymous</Badge> : <span className="font-telugu">{donor(r)}</span>), csv: donor },
          { label: "Amount", right: true, cell: (r) => <Amt v={r.amount} />, csv: (r) => r.amount },
          { label: "Mode", cell: (r) => r.payment_mode ?? "—", csv: (r) => r.payment_mode ?? "" },
          { label: "Receipt no.", cell: (r) => r.receipt_no ?? "—", csv: (r) => r.receipt_no ?? "" },
          { label: "Event", cell: (r) => o.nameOf.event(r.event_id), csv: (r) => o.nameOf.event(r.event_id) },
        ]}
        describe={(r) => `${donor(r)} (${money(r.amount)})`}
        footer={(rows) => {
          const by = new Map<string, number>();
          for (const r of rows) { const k = `${r.received_on.slice(0, 4)}-${String(monthOf(r.received_on)).padStart(2, "0")}`; by.set(k, sum([by.get(k) ?? 0, r.amount])); }
          const ms = [...by.entries()].sort((a, b) => b[0].localeCompare(a[0]));
          return <><h3 className="mb-2 font-semibold text-burgundy">Monthly totals</h3><Table head={["Month", "Total"]} right={[1]} rows={ms.map(([k, v]) => [`${MONTHS[Number(k.slice(5)) - 1]} ${k.slice(0, 4)}`, <Amt key={k} v={v} />])} /></>;
        }}
      />
    </>
  );
}
