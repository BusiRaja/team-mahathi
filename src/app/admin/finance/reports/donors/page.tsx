"use client";

import { useMemo, useState } from "react";
import Crud from "@/components/finance/Crud";
import { Amt, Badge, PageHead, PrintButton, Section, Stat, Table } from "@/components/finance/ui";
import { donorReport, downloadCsv, fmtDay, fyLabel, fyOf, inYear, money, sum, type Donor } from "@/lib/finance";
import { useFin } from "@/lib/useFinance";

export default function DonorsPage() {
  const { data, year, sm } = useFin();
  const [sel, setSel] = useState("");
  const scoped = useMemo(() => inYear(data.donations, (d) => d.received_on, year, sm), [data, year, sm]);
  const rep = useMemo(() => donorReport(data, scoped), [data, scoped]);
  // A repeat donor has given in more than one financial year (across all records, not just the selected year).
  const yearsGiven = useMemo(() => { const m = new Map<string, Set<number>>(); for (const d of data.donations) if (d.donor_id) (m.get(d.donor_id) ?? m.set(d.donor_id, new Set()).get(d.donor_id)!).add(fyOf(d.received_on, sm)); return m; }, [data, sm]);
  const picked = data.donors.find((d) => d.id === sel);
  const stmt = picked ? data.donations.filter((d) => d.donor_id === picked.id && (year === "all" || fyOf(d.received_on, sm) === year)).sort((a, b) => a.received_on.localeCompare(b.received_on)) : [];

  return (
    <>
      <PageHead title="Donor Management & Report" blurb="Keep the donor directory here, then see who gave how much. Anonymous donations are totalled separately." />
      <Crud<Donor>
        table="fin_donors" noun="donor" title="Donor directory" exportName="team-mahathi-donor-directory" rows={data.donors} allYears
        blank={{ name: "", phone: "", email: "", address: "", notes: "" }}
        fields={[{ key: "name", label: "Name", type: "text", required: true }, { key: "phone", label: "Phone", type: "tel" }, { key: "email", label: "Email", type: "email" }, { key: "address", label: "Address", type: "text", wide: true }, { key: "notes", label: "Notes", type: "textarea" }]}
        search={(r) => `${r.name} ${r.phone ?? ""} ${r.email ?? ""}`}
        cols={[
          { label: "Name", cell: (r) => <span className="font-telugu font-medium">{r.name}</span>, csv: (r) => r.name }, { label: "Phone", cell: (r) => r.phone ?? "—", csv: (r) => r.phone ?? "" },
          { label: "Email", cell: (r) => r.email ?? "—", csv: (r) => r.email ?? "" }, { label: "Address", cell: (r) => r.address ?? "—", csv: (r) => r.address ?? "" },
        ]}
        describe={(r) => r.name}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Named donors" value={String(rep.donors.length)} /><Stat label="Total donated" value={money(sum(scoped.map((d) => d.amount)))} tone="good" />
        <Stat label="Anonymous" value={money(rep.anon.total)} hint={`${rep.anon.count} donation${rep.anon.count === 1 ? "" : "s"}`} /><Stat label="Repeat donors" value={String(rep.donors.filter((d) => (yearsGiven.get(d.donor.id)?.size ?? 0) > 1).length)} hint="Gave in 2+ years" />
      </div>
      <Section title={`Donor-wise totals, ${year === "all" ? "all years" : fyLabel(year, sm)}`} right={<div className="flex gap-2 print:hidden"><button className="btn-ghost" disabled={!rep.donors.length} onClick={() => downloadCsv("team-mahathi-donor-report", ["Donor", "Phone", "Donations", "Total", "First", "Last", "Years given"], rep.donors.map((d) => [d.donor.name, d.donor.phone ?? "", d.count, d.total, d.first, d.last, yearsGiven.get(d.donor.id)?.size ?? 0]))}>Download CSV</button><PrintButton /></div>}>
        <Table head={["Donor", "Donations", "Total", "First", "Latest", ""]} right={[1, 2]} empty="No named donations in this period."
          rows={[...rep.donors.map((d) => [<span key="n" className="font-telugu font-medium">{d.donor.name}</span>, d.count, <Amt key="t" v={d.total} />, fmtDay(d.first), fmtDay(d.last), (yearsGiven.get(d.donor.id)?.size ?? 0) > 1 ? <Badge key="b" tone="good">Repeat donor</Badge> : ""]),
            ...(rep.anon.count ? [["Anonymous", rep.anon.count, <Amt key="a" v={rep.anon.total} />, "", "", ""]] : [])]} />
      </Section>
      <Section title="Donor statement" right={<select className="field !w-auto print:hidden" aria-label="Choose donor" value={sel} onChange={(e) => setSel(e.target.value)}><option value="">Choose a donor…</option>{data.donors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>}>
        {!picked ? <p className="py-4 text-sm text-burgundy/70">Choose a donor to see everything they have given, ready to print or save as PDF.</p> : (
          <>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div><p className="font-display text-lg font-bold text-burgundy">{picked.name}</p><p className="text-sm text-burgundy/70">{[picked.phone, picked.email, picked.address].filter(Boolean).join(" · ")}</p><p className="text-xs text-burgundy/60">Team Mahathi, Gajwel · {year === "all" ? "All years" : `FY ${fyLabel(year, sm)}`}</p></div>
              <div className="flex gap-2 print:hidden"><button className="btn-ghost" onClick={() => downloadCsv(`donor-statement-${picked.name}`, ["Date", "Amount", "Payment mode", "Receipt no."], stmt.map((d) => [d.received_on, d.amount, d.payment_mode ?? "", d.receipt_no ?? ""]))}>Download CSV</button><PrintButton /></div>
            </div>
            <Table head={["Date", "Receipt no.", "Mode", "Amount"]} right={[3]} empty="No donations in this period." rows={stmt.map((d) => [fmtDay(d.received_on), d.receipt_no ?? "—", d.payment_mode ?? "—", <Amt key={d.id} v={d.amount} />])} foot={["Total", "", "", <Amt key="t" v={sum(stmt.map((d) => d.amount))} />]} />
          </>
        )}
      </Section>
    </>
  );
}
