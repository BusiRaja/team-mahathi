"use client";

import Crud from "@/components/finance/Crud";
import { Amt, Badge, PageHead } from "@/components/finance/ui";
import { money, sum, type Category } from "@/lib/finance";
import { useFin } from "@/lib/useFinance";

export default function CategoriesPage() {
  const { data } = useFin();
  const spent = (id: string) => data.expenses.filter((e) => e.category_id === id);
  return (
    <>
      <PageHead title="Expense Categories" blurb="Categories such as decoration, prasadam, transport, electricity and sound. A category that already has expenses cannot be deleted. Mark it inactive instead and it disappears from new entries but stays in reports." />
      <Crud<Category>
        table="fin_categories" noun="category" title="Categories" exportName="team-mahathi-categories" rows={data.categories} allYears
        blank={{ name: "", active: true }}
        fields={[{ key: "name", label: "Category name", type: "text", required: true }, { key: "active", label: "Active (available for new expenses)", type: "checkbox" }]}
        search={(r) => r.name}
        stats={(r) => [{ label: "Categories", value: String(r.length) }, { label: "Active", value: String(r.filter((c) => c.active).length) }, { label: "All-time spending", value: money(sum(data.expenses.map((e) => e.amount))) }]}
        cols={[
          { label: "Category", cell: (r) => <span className="font-telugu font-medium">{r.name}</span>, csv: (r) => r.name },
          { label: "Status", cell: (r) => <Badge tone={r.active ? "good" : "warn"}>{r.active ? "Active" : "Inactive"}</Badge>, csv: (r) => (r.active ? "Active" : "Inactive") },
          { label: "Expenses", right: true, cell: (r) => spent(r.id).length, csv: (r) => spent(r.id).length },
          { label: "All-time total", right: true, cell: (r) => <Amt v={sum(spent(r.id).map((e) => e.amount))} />, csv: (r) => sum(spent(r.id).map((e) => e.amount)) },
        ]}
        describe={(r) => r.name}
      />
    </>
  );
}
