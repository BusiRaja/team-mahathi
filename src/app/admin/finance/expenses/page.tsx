"use client";

import Crud from "@/components/finance/Crud";
import { Amt, PageHead } from "@/components/finance/ui";
import { useOptions } from "@/components/finance/options";
import { fmtDay, money, sum, today, type Expense } from "@/lib/finance";
import { useFin } from "@/lib/useFinance";

export default function ExpensesPage() {
  const { data } = useFin();
  const o = useOptions();
  return (
    <>
      <PageHead title="Expenses" blurb="Record every rupee spent, with the bill attached. Edits and deletes ask for a reason and are saved in the audit log." />
      <Crud<Expense>
        table="fin_expenses" noun="expense" title="Expense records" exportName="team-mahathi-expenses" rows={data.expenses} dateKey="spent_on"
        blank={{ spent_on: today(), item: "", category_id: "", amount: "", payment_mode: "", event_id: "", vendor: "", receipt_url: "", notes: "" }}
        fields={[
          { key: "spent_on", label: "Date", type: "date", required: true }, { key: "item", label: "Item", type: "text", required: true, placeholder: "e.g. Marigold garlands" },
          { key: "amount", label: "Amount (₹)", type: "number", required: true },
          { key: "category_id", label: "Category", type: "select", options: o.categories, help: "Manage categories under Setup → Categories" },
          { key: "payment_mode", label: "Payment mode", type: "select", options: o.modes }, { key: "event_id", label: "Event", type: "select", options: o.events },
          { key: "vendor", label: "Vendor / paid to", type: "text" }, { key: "receipt_url", label: "Receipt or bill", type: "file" }, { key: "notes", label: "Notes", type: "textarea" },
        ]}
        validate={(f) => (Number(f.amount) > 0 ? null : "Amount must be more than zero")}
        search={(r) => `${r.item} ${r.vendor ?? ""} ${o.nameOf.category(r.category_id)} ${r.notes ?? ""}`}
        filters={[
          { label: "Category", options: o.allCategories, test: (r, v) => r.category_id === v },
          { label: "Payment mode", options: o.modes, test: (r, v) => r.payment_mode === v },
          { label: "Event", options: o.events, test: (r, v) => r.event_id === v },
        ]}
        stats={(r) => [
          { label: "Total spent", value: money(sum(r.map((x) => x.amount))) }, { label: "Entries", value: String(r.length) },
          { label: "Average", value: money(r.length ? sum(r.map((x) => x.amount)) / r.length : 0) },
          { label: "Without receipt", value: String(r.filter((x) => !x.receipt_url).length), hint: "Attach bills for audit" },
        ]}
        cols={[
          { label: "Date", cell: (r) => fmtDay(r.spent_on), csv: (r) => r.spent_on },
          { label: "Item", cell: (r) => <><span className="font-telugu font-medium">{r.item}</span>{r.vendor && <span className="block text-xs text-burgundy/60">{r.vendor}</span>}</>, csv: (r) => r.item },
          { label: "Category", cell: (r) => o.nameOf.category(r.category_id), csv: (r) => o.nameOf.category(r.category_id) },
          { label: "Event", cell: (r) => o.nameOf.event(r.event_id), csv: (r) => o.nameOf.event(r.event_id) },
          { label: "Mode", cell: (r) => r.payment_mode ?? "—", csv: (r) => r.payment_mode ?? "" },
          { label: "Amount", right: true, cell: (r) => <Amt v={r.amount} />, csv: (r) => r.amount },
          { label: "Receipt", cell: (r) => (r.receipt_url ? <a className="text-burgundy underline" href={r.receipt_url} target="_blank" rel="noreferrer">View</a> : "—"), csv: (r) => r.receipt_url ?? "" },
        ]}
        describe={(r) => `${r.item} (${money(r.amount)})`}
      />
    </>
  );
}
