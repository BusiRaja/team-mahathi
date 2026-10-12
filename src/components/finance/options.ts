"use client";

import { useFin } from "@/lib/useFinance";

/** Dropdown options built from the loaded finance data. */
export function useOptions() {
  const { data } = useFin();
  const o = <T,>(xs: T[], v: (x: T) => string, l: (x: T) => string) => xs.map((x) => ({ value: v(x), label: l(x) }));
  return {
    categories: o(data.categories.filter((c) => c.active), (c) => c.id, (c) => c.name),
    allCategories: o(data.categories, (c) => c.id, (c) => c.name + (c.active ? "" : " (inactive)")),
    modes: o(data.modes.filter((m) => m.active), (m) => m.name, (m) => m.name),
    events: o(data.events, (e) => e.id, (e) => `${e.title_te || e.title} · ${e.starts_at.slice(0, 10)}`),
    donors: o(data.donors, (d) => d.id, (d) => d.name + (d.phone ? ` · ${d.phone}` : "")),
    sponsors: o(data.sponsors, (s) => s.id, (s) => s.name),
    nameOf: {
      category: (id: string | null) => data.categories.find((c) => c.id === id)?.name ?? "—",
      event: (id: string | null) => { const e = data.events.find((x) => x.id === id); return e ? e.title_te || e.title : "—"; },
      donor: (id: string | null) => data.donors.find((d) => d.id === id)?.name ?? "—",
      sponsor: (id: string | null) => data.sponsors.find((s) => s.id === id)?.name ?? "—",
    },
  };
}
