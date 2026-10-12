"use client";

import { useMemo } from "react";
import Crud from "@/components/finance/Crud";
import { Amt, Badge, PageHead, PrintButton, Section, Stat, Table } from "@/components/finance/ui";
import { downloadCsv, fyLabel, inYear, money, sponsorReport, sum, type Sponsor } from "@/lib/finance";
import { useFin } from "@/lib/useFinance";

export default function SponsorsPage() {
  const { data, year, sm } = useFin();
  const scoped = useMemo(() => inYear(data.sponsorships, (s) => s.committed_on, year, sm), [data, year, sm]);
  const rep = useMemo(() => sponsorReport(data, scoped), [data, scoped]);
  return (
    <>
      <PageHead title="Sponsor Management & Report" blurb="Keep the sponsor directory here, then see cash and in-kind contributions and what is still owed. In-kind values are never added to cash." />
      <Crud<Sponsor>
        table="fin_sponsors" noun="sponsor" title="Sponsor directory" exportName="team-mahathi-sponsor-directory" rows={data.sponsors} allYears
        blank={{ name: "", contact_person: "", phone: "", email: "", notes: "" }}
        fields={[{ key: "name", label: "Sponsor / business", type: "text", required: true }, { key: "contact_person", label: "Contact person", type: "text" }, { key: "phone", label: "Phone", type: "tel" }, { key: "email", label: "Email", type: "email" }, { key: "notes", label: "Notes", type: "textarea" }]}
        search={(r) => `${r.name} ${r.contact_person ?? ""} ${r.phone ?? ""}`}
        cols={[
          { label: "Sponsor", cell: (r) => <span className="font-telugu font-medium">{r.name}</span>, csv: (r) => r.name }, { label: "Contact", cell: (r) => r.contact_person ?? "—", csv: (r) => r.contact_person ?? "" },
          { label: "Phone", cell: (r) => r.phone ?? "—", csv: (r) => r.phone ?? "" }, { label: "Email", cell: (r) => r.email ?? "—", csv: (r) => r.email ?? "" },
        ]}
        describe={(r) => r.name}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Sponsors" value={String(rep.length)} /><Stat label="Cash received" value={money(sum(rep.map((r) => r.cashReceived)))} tone="good" />
        <Stat label="In-kind value" value={money(sum(rep.map((r) => r.inKind)))} hint="Not cash" /><Stat label="Still due" value={money(sum(rep.map((r) => r.pending)))} tone={sum(rep.map((r) => r.pending)) > 0 ? "bad" : undefined} />
      </div>
      <Section title={`Sponsor report, ${year === "all" ? "all years" : fyLabel(year, sm)}`} right={<div className="flex gap-2 print:hidden"><button className="btn-ghost" disabled={!rep.length} onClick={() => downloadCsv("team-mahathi-sponsor-report", ["Sponsor", "Items", "Cash committed", "Cash received", "In-kind value", "Still due"], rep.map((r) => [r.sponsor.name, r.items.map((i) => `${i.item} (${i.kind === "cash" ? "cash" : "in-kind"})`).join("; "), r.cashCommitted, r.cashReceived, r.inKind, r.pending]))}>Download CSV</button><PrintButton /></div>}>
        <Table head={["Sponsor", "Sponsored", "Cash committed", "Cash received", "In-kind value", "Still due"]} right={[2, 3, 4, 5]} empty="No sponsorships in this period."
          rows={rep.map((r) => [<span key="n" className="font-telugu font-medium">{r.sponsor.name}</span>,
            <ul key="i" className="space-y-0.5">{r.items.map((i) => <li key={i.id} className="font-telugu">{i.item} <Badge tone={i.kind === "cash" ? "good" : "plain"}>{i.kind === "cash" ? "Cash" : "In-kind"}</Badge></li>)}</ul>,
            <Amt key="a" v={r.cashCommitted} />, <Amt key="b" v={r.cashReceived} />, <Amt key="c" v={r.inKind} />, r.pending > 0 ? <Badge key="d" tone="warn">{money(r.pending)}</Badge> : "—"])} />
      </Section>
    </>
  );
}
