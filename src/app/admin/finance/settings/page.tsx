"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Crud from "@/components/finance/Crud";
import { Badge, PageHead, Section, Table } from "@/components/finance/ui";
import { supabase } from "@/lib/supabase";
import { fyLabel, money, MONTHS, type AuditRow, type PaymentMode, type YearRow } from "@/lib/finance";
import { loadAudit, useFin } from "@/lib/useFinance";

const TABLES: Record<string, string> = { fin_expenses: "Expense", fin_donations: "Donation", fin_auction_lots: "Auction lot", fin_sponsorships: "Sponsorship", fin_donors: "Donor", fin_sponsors: "Sponsor", fin_categories: "Category", fin_event_budgets: "Event budget", fin_years: "Year", fin_payment_modes: "Payment mode", fin_settings: "Setting" };
const HIDE = new Set(["id", "created_at", "created_by"]);
const show = (v: unknown) => (v == null || v === "" ? "empty" : typeof v === "number" ? v.toLocaleString("en-IN") : String(v));

function summary(a: AuditRow): string {
  const row = (a.new_row ?? a.old_row ?? {}) as Record<string, unknown>;
  const name = row.item ?? row.name ?? row.lot_name ?? row.key ?? (row.amount != null ? money(Number(row.amount)) : "");
  return String(name || "");
}
function changes(a: AuditRow): string[] {
  if (a.action !== "UPDATE" || !a.old_row || !a.new_row) return [];
  return Object.keys(a.new_row).filter((k) => !HIDE.has(k) && JSON.stringify(a.old_row![k]) !== JSON.stringify(a.new_row![k])).map((k) => `${k.replace(/_/g, " ")}: ${show(a.old_row![k])} → ${show(a.new_row![k])}`);
}

export default function SettingsPage() {
  const { data, sm, save, askReason, say } = useFin();
  const [month, setMonth] = useState(String(sm));
  const [setting, setSetting] = useState<{ id: string } | null>(null);
  const [audit, setAudit] = useState<AuditRow[] | null>(null);
  const [auditErr, setAuditErr] = useState("");
  const [fTable, setFTable] = useState(""); const [fAction, setFAction] = useState("");

  useEffect(() => { setMonth(String(sm)); }, [sm]);
  useEffect(() => { supabase!.from("fin_settings").select("id").eq("key", "fy_start_month").maybeSingle().then(({ data: d }) => setSetting(d)); }, []);
  const refreshAudit = useCallback(() => { loadAudit().then(setAudit).catch((e) => setAuditErr(e.message)); }, []);
  useEffect(() => { refreshAudit(); }, [refreshAudit, data]);

  const saveMonth = async () => {
    const reason = await askReason({ title: "Change the financial year start month?", confirm: "Change" }); if (!reason) return;
    const err = setting ? await save("fin_settings", setting.id, { value: month }, reason) : await save("fin_settings", null, { key: "fy_start_month", value: month }, null);
    say(err ?? "Financial year updated");
  };
  const rows = useMemo(() => (audit ?? []).filter((a) => (!fTable || a.table_name === fTable) && (!fAction || a.action === fAction)), [audit, fTable, fAction]);

  return (
    <>
      <PageHead title="Financial Settings & Audit Log" blurb="Financial year, opening balances, payment modes, and a permanent record of every change." />
      <Section title="Financial year">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium">Financial year starts in
            <select className="field mt-1" value={month} onChange={(e) => setMonth(e.target.value)}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}{i === 0 ? " (calendar year)" : i === 3 ? " (April to March)" : ""}</option>)}</select>
          </label>
          <button className="btn-royal" onClick={saveMonth} disabled={Number(month) === sm}>Save</button>
        </div>
        <p className="mt-2 text-xs text-burgundy/70">Currently {sm === 1 ? "the calendar year" : `${MONTHS[sm - 1]} to ${MONTHS[(sm + 10) % 12]}`}, for example FY {fyLabel(new Date().getFullYear(), sm)}. Changing this regroups all reports; no records are altered.</p>
      </Section>

      <Crud<YearRow>
        table="fin_years" noun="year" title="Opening balances" exportName="team-mahathi-opening-balances" rows={data.years} allYears
        blurb="Enter the cash in hand at the start of a year. Leave it blank for a year to carry forward the previous year's closing balance automatically."
        blank={{ year: String(new Date().getFullYear()), opening_balance: "", notes: "" }}
        fields={[{ key: "year", label: "Year (the calendar year it starts in)", type: "number", required: true }, { key: "opening_balance", label: "Opening balance (₹)", type: "number", help: "Blank = carry forward" }, { key: "notes", label: "Notes", type: "text", wide: true }]}
        normalize={(p) => ({ ...p, year: Math.round(Number(p.year)) })}
        validate={(f) => (Number(f.year) >= 1990 && Number(f.year) <= 2100 ? null : "Enter a valid year")}
        cols={[{ label: "Year", cell: (r) => fyLabel(r.year, sm), csv: (r) => r.year }, { label: "Opening balance", right: true, cell: (r) => (r.opening_balance == null ? <Badge>Carried forward</Badge> : money(Number(r.opening_balance))), csv: (r) => r.opening_balance ?? "" }, { label: "Notes", cell: (r) => r.notes ?? "—", csv: (r) => r.notes ?? "" }]}
        describe={(r) => String(r.year)}
      />

      <Crud<PaymentMode>
        table="fin_payment_modes" noun="payment mode" title="Payment modes" exportName="team-mahathi-payment-modes" rows={data.modes} allYears
        blank={{ name: "", active: true }}
        fields={[{ key: "name", label: "Name", type: "text", required: true }, { key: "active", label: "Active", type: "checkbox" }]}
        cols={[{ label: "Payment mode", cell: (r) => r.name, csv: (r) => r.name }, { label: "Status", cell: (r) => <Badge tone={r.active ? "good" : "warn"}>{r.active ? "Active" : "Inactive"}</Badge>, csv: (r) => (r.active ? "Active" : "Inactive") }]}
        describe={(r) => r.name}
      />

      <Section title="Who can use finance">
        <p className="text-sm">Only accounts listed in the <code>admins</code> table can see or change anything here, and the database enforces it. Visitors and signed-in non-admins get nothing back even if they call the API directly. Add or remove admins in Supabase (Table Editor → <code>admins</code>).</p>
      </Section>

      <Section title="Audit log" right={<div className="flex gap-2 print:hidden">
        <select className="field !w-auto" aria-label="Record type" value={fTable} onChange={(e) => setFTable(e.target.value)}><option value="">All record types</option>{Object.entries(TABLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select className="field !w-auto" aria-label="Action" value={fAction} onChange={(e) => setFAction(e.target.value)}><option value="">All actions</option><option value="INSERT">Added</option><option value="UPDATE">Edited</option><option value="DELETE">Deleted</option></select></div>}>
        <p className="mb-3 text-sm text-burgundy/70">Every addition, edit and deletion is recorded automatically with who, when and why. Entries cannot be edited or removed. Showing the latest 300.</p>
        {auditErr && <p role="alert" className="text-sm text-red-700">{auditErr}</p>}
        {!audit ? <p className="py-4 text-sm" role="status">Loading…</p> : (
          <Table head={["When", "Who", "Action", "Record", "Reason / changes"]} empty="No audit entries yet." rows={rows.map((a) => [
            new Date(a.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }), a.user_email ?? "system",
            <Badge key="a" tone={a.action === "DELETE" ? "bad" : a.action === "UPDATE" ? "warn" : "good"}>{a.action === "INSERT" ? "Added" : a.action === "UPDATE" ? "Edited" : "Deleted"}</Badge>,
            <span key="r"><b>{TABLES[a.table_name] ?? a.table_name}</b><span className="block font-telugu text-xs text-burgundy/70">{summary(a)}</span></span>,
            <span key="w">{a.reason && <span className="block">{a.reason}</span>}{changes(a).map((c) => <span key={c} className="block text-xs text-burgundy/70">{c}</span>)}</span>,
          ])} />
        )}
      </Section>
    </>
  );
}
