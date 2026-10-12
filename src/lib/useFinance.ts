"use client";

import { createContext, useContext } from "react";
import { supabase } from "./supabase";
import { emptyData, type FinData, type AuditRow } from "./finance";

export interface FinCtx {
  data: FinData; loading: boolean; error: string; reload: () => Promise<void>;
  year: number | "all"; setYear: (y: number | "all") => void; yearOptions: number[]; sm: number;
  say: (m: string) => void;
  askReason: (o: { title: string; confirm: string; danger?: boolean }) => Promise<string | null>;
  save: (table: string, id: string | null, row: Record<string, unknown>, reason: string | null) => Promise<string | null>;
  remove: (table: string, id: string, reason: string) => Promise<string | null>;
}
export const FinContext = createContext<FinCtx | null>(null);
export function useFin(): FinCtx {
  const c = useContext(FinContext);
  if (!c) throw new Error("useFin must be used inside the finance layout");
  return c;
}

/** Plain-language messages for the database errors people will actually hit. */
export function friendlyError(e: { message: string; code?: string }): string {
  if (e.code === "23503" || /foreign key/i.test(e.message)) return "This record is used elsewhere (for example a category with expenses). Mark it inactive instead of deleting it, or remove the linked records first.";
  if (e.code === "23505" || /duplicate key/i.test(e.message)) return "A record with this name or year already exists.";
  if (e.code === "23514" || /check constraint/i.test(e.message)) return "A value is not allowed: amounts must be positive, an auction cannot collect more than the final bid, and in-kind sponsorships cannot hold cash.";
  if (e.code === "42501" || /row-level security|Not allowed/i.test(e.message)) return "Your account is not allowed to do this. Only admins can manage finances.";
  return e.message;
}

/** PostgREST returns at most 1000 rows per request, so page through until everything is loaded. */
async function all<T>(table: string, order?: string, select = "*"): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    let q = supabase!.from(table).select(select).range(from, from + 999);
    if (order) q = q.order(order, { ascending: false });
    const { data, error } = await q;
    if (error) throw new Error(friendlyError(error));
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) return out;
  }
}
const n = <T extends object>(rows: T[], keys: string[]) => rows.map((r) => { const o = { ...r } as Record<string, unknown>; for (const k of keys) if (o[k] != null) o[k] = Number(o[k]); return o as T; });

export async function loadFinance(): Promise<FinData> {
  const [categories, donors, sponsors, expenses, donations, lots, sponsorships, budgets, years, modes, events, settings] = await Promise.all([
    all<never>("fin_categories", "name"), all<never>("fin_donors", "name"), all<never>("fin_sponsors", "name"),
    all<never>("fin_expenses", "spent_on"), all<never>("fin_donations", "received_on"), all<never>("fin_auction_lots", "auction_date"),
    all<never>("fin_sponsorships", "committed_on"), all<never>("fin_event_budgets"), all<never>("fin_years", "year"), all<never>("fin_payment_modes", "name"),
    all<never>("events", "starts_at", "id,title,title_te,starts_at"), all<{ key: string; value: string }>("fin_settings"),
  ]);
  const start = Number(settings.find((s) => s.key === "fy_start_month")?.value) || 1;
  return {
    ...emptyData(), categories, donors, sponsors, modes, events, startMonth: start >= 1 && start <= 12 ? start : 1,
    expenses: n(expenses, ["amount"]), donations: n(donations, ["amount"]),
    lots: n(lots, ["final_bid", "amount_collected"]), sponsorships: n(sponsorships, ["estimated_value", "received_amount"]),
    budgets: n(budgets, ["budget"]), years: n(years, ["year", "opening_balance"]),
  };
}

export async function loadAudit(limit = 300): Promise<AuditRow[]> {
  const { data, error } = await supabase!.from("fin_audit_log").select("*").order("at", { ascending: false }).limit(limit);
  if (error) throw new Error(friendlyError(error));
  return (data ?? []) as AuditRow[];
}

/** New rows are inserted directly. Edits and deletes go through database functions that insist on a reason and write the audit log. */
export async function saveRow(table: string, id: string | null, row: Record<string, unknown>, reason: string | null): Promise<string | null> {
  const { error } = id
    ? await supabase!.rpc("fin_update", { p_table: table, p_id: id, p_patch: row, p_reason: reason ?? "" })
    : await supabase!.from(table).insert(row);
  return error ? friendlyError(error) : null;
}
export async function deleteRow(table: string, id: string, reason: string): Promise<string | null> {
  const { error } = await supabase!.rpc("fin_delete", { p_table: table, p_id: id, p_reason: reason });
  return error ? friendlyError(error) : null;
}
