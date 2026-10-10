"use client";

import { useMemo, useState } from "react";
import UpdateCard, { GROUPS, groupOf } from "./UpdateCard";
import { toText } from "@/lib/text";
import type { FestUpdate } from "@/lib/types";

export default function UpdatesFeed({ updates }: { updates: FestUpdate[] }) {
  const [group, setGroup] = useState<string>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "old" | "popular">("new");
  const [list, setList] = useState(false);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return updates
      .filter((u) => (group === "all" || groupOf(u.kind) === group) && (!needle || `${u.title} ${u.title_te ?? ""} ${toText(u.body)} ${toText(u.body_te)}`.toLowerCase().includes(needle)))
      .sort((a, b) =>
        sort === "popular" ? (b.views ?? 0) - (a.views ?? 0)
        : sort === "old" ? +new Date(a.created_at) - +new Date(b.created_at)
        : Number(b.pinned) - Number(a.pinned) || +new Date(b.created_at) - +new Date(a.created_at));
  }, [updates, group, q, sort]);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist">
          {GROUPS.map((g) => (
            <button key={g.key} role="tab" aria-selected={group === g.key} onClick={() => setGroup(g.key)} className={`chip ${group === g.key ? "chip-active" : ""}`}><span aria-hidden className="mr-1.5">{g.icon}</span>{g.label}</button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search updates..." aria-label="Search updates" className="field ml-auto !w-full sm:!w-56" />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <h2 className="section-title">Latest Updates</h2>
        <div className="flex items-center gap-2">
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort updates" className="field !w-auto !py-1.5">
            <option value="new">Latest First</option><option value="old">Oldest First</option><option value="popular">Most Viewed</option>
          </select>
          <div className="flex overflow-hidden rounded-lg border border-gold/40 text-sm">
            <button onClick={() => setList(false)} aria-pressed={!list} className={`px-3 py-1.5 ${!list ? "bg-burgundy text-white" : "bg-white"}`}>Grid</button>
            <button onClick={() => setList(true)} aria-pressed={list} className={`px-3 py-1.5 ${list ? "bg-burgundy text-white" : "bg-white"}`}>List</button>
          </div>
        </div>
      </div>
      <div className={`mt-4 grid gap-4 ${list ? "" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
        {shown.map((u) => <UpdateCard key={u.id} u={u} list={list} />)}
      </div>
      {!shown.length && <p className="royal-card mt-4 p-8 text-center">No updates match. Try another filter or search.</p>}
    </div>
  );
}
