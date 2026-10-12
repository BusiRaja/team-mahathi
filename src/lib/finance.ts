/** Team Mahathi finance: types, money helpers and every calculation the reports use. Pure functions, no I/O. */

export interface Category { id: string; name: string; active: boolean }
export interface Donor { id: string; name: string; phone: string | null; email: string | null; address: string | null; notes: string | null }
export interface Sponsor { id: string; name: string; contact_person: string | null; phone: string | null; email: string | null; notes: string | null }
export interface Expense { id: string; spent_on: string; item: string; category_id: string | null; amount: number; payment_mode: string | null; event_id: string | null; vendor: string | null; receipt_url: string | null; notes: string | null }
export interface Donation { id: string; received_on: string; donor_id: string | null; anonymous: boolean; amount: number; payment_mode: string | null; event_id: string | null; receipt_no: string | null; notes: string | null }
export interface Lot { id: string; auction_name: string; auction_date: string; event_id: string | null; lot_name: string; description: string | null; winning_bidder: string | null; bidder_phone: string | null; final_bid: number; amount_collected: number; collected_on: string | null; payment_mode: string | null; notes: string | null }
export interface Sponsorship { id: string; sponsor_id: string; kind: "cash" | "in_kind"; item: string; estimated_value: number; committed_on: string; status: "pledged" | "partial" | "received" | "cancelled"; received_amount: number; received_on: string | null; payment_mode: string | null; event_id: string | null; notes: string | null }
export interface EventBudget { id: string; event_id: string; budget: number; notes: string | null }
export interface YearRow { id: string; year: number; opening_balance: number | null; notes: string | null }
export interface PaymentMode { id: string; name: string; active: boolean }
export interface FinEvent { id: string; title: string; title_te?: string | null; starts_at: string }
export interface AuditRow { id: number; at: string; user_email: string | null; action: string; table_name: string; record_id: string | null; reason: string | null; old_row: Record<string, unknown> | null; new_row: Record<string, unknown> | null }

export interface FinData {
  categories: Category[]; donors: Donor[]; sponsors: Sponsor[]; expenses: Expense[]; donations: Donation[]; lots: Lot[];
  sponsorships: Sponsorship[]; budgets: EventBudget[]; years: YearRow[]; modes: PaymentMode[]; events: FinEvent[];
  startMonth: number;
}
export const emptyData = (): FinData => ({ categories: [], donors: [], sponsors: [], expenses: [], donations: [], lots: [], sponsorships: [], budgets: [], years: [], modes: [], events: [], startMonth: 1 });

/* ---------- money (integer paise so sums never drift) ---------- */
export const toPaise = (n: number | string | null | undefined) => Math.round((Number(n) || 0) * 100);
export const sum = (xs: (number | string | null | undefined)[]) => xs.reduce<number>((a, b) => a + toPaise(b), 0) / 100;
const r2 = (n: number) => Math.round(n * 100) / 100;
const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
export const money = (n: number) => INR.format(n);

/* ---------- dates (stored as YYYY-MM-DD, handled as plain strings so time zones never shift them) ---------- */
export const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const monthOf = (d: string) => Number(d.slice(5, 7));
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

/** Financial year a date belongs to, labelled by the calendar year it starts in (start month 1 = plain calendar year). */
export const fyOf = (d: string, startMonth = 1) => { const y = Number(d.slice(0, 4)); return startMonth === 1 || monthOf(d) >= startMonth ? y : y - 1; };
export const fyLabel = (y: number, startMonth = 1) => (startMonth === 1 ? String(y) : `${y}–${String(y + 1).slice(2)}`);
/** Month numbers in the order a financial year runs. */
export const fyMonths = (startMonth = 1) => Array.from({ length: 12 }, (_, i) => ((startMonth - 1 + i) % 12) + 1);

/* ---------- unified income ---------- */
export type IncomeSource = "Donation" | "Auction" | "Sponsorship (cash)";
export interface IncomeRow { key: string; date: string; source: IncomeSource; amount: number; label: string; event_id: string | null }

/** Cash actually received, each rupee once: donations + auction collections + cash sponsorships received. In-kind and unpaid amounts are excluded. */
export function incomeRows(d: FinData): IncomeRow[] {
  const donor = new Map(d.donors.map((x) => [x.id, x.name]));
  const sponsor = new Map(d.sponsors.map((x) => [x.id, x.name]));
  const rows: IncomeRow[] = [];
  for (const x of d.donations) rows.push({ key: `d${x.id}`, date: x.received_on, source: "Donation", amount: x.amount, label: x.anonymous ? "Anonymous donor" : donor.get(x.donor_id ?? "") ?? "Donor", event_id: x.event_id });
  for (const x of d.lots) if (x.amount_collected > 0) rows.push({ key: `a${x.id}`, date: x.collected_on ?? x.auction_date, source: "Auction", amount: x.amount_collected, label: `${x.lot_name} (${x.auction_name})`, event_id: x.event_id });
  for (const x of d.sponsorships) if (x.kind === "cash" && x.status !== "cancelled" && x.received_amount > 0) rows.push({ key: `s${x.id}`, date: x.received_on ?? x.committed_on, source: "Sponsorship (cash)", amount: x.received_amount, label: `${sponsor.get(x.sponsor_id) ?? "Sponsor"}: ${x.item}`, event_id: x.event_id });
  return rows;
}

/** Money promised but not yet received. Tracked separately and never counted in income or balance. */
export const pendingAuction = (l: Lot) => Math.max(0, sum([l.final_bid]) - sum([l.amount_collected]));
export const pendingSponsorship = (s: Sponsorship) => (s.kind === "cash" && s.status !== "cancelled" && s.status !== "received" ? Math.max(0, sum([s.estimated_value]) - sum([s.received_amount])) : 0);

/* ---------- per-year totals with carried-forward balances ---------- */
export interface YearSummary {
  year: number; opening: number; donations: number; auction: number; sponsorCash: number; income: number; expenses: number;
  surplus: number; closing: number; inKind: number; pendingAuction: number; pendingSponsor: number; explicitOpening: boolean;
}

export function yearSummaries(d: FinData): YearSummary[] {
  const sm = d.startMonth;
  const seen = new Set<number>(d.years.map((y) => y.year));
  for (const e of d.expenses) seen.add(fyOf(e.spent_on, sm));
  for (const r of incomeRows(d)) seen.add(fyOf(r.date, sm));
  for (const l of d.lots) seen.add(fyOf(l.auction_date, sm));
  for (const s of d.sponsorships) seen.add(fyOf(s.committed_on, sm));
  if (!seen.size) return [];
  const list = [...seen].sort((a, b) => a - b);
  const all = Array.from({ length: list[list.length - 1] - list[0] + 1 }, (_, i) => list[0] + i);
  const inc = incomeRows(d);
  const out: YearSummary[] = [];
  let carry = 0;
  for (const year of all) {
    const row = d.years.find((y) => y.year === year);
    const explicit = row?.opening_balance != null;
    const opening = explicit ? Number(row!.opening_balance) : carry;
    const inY = inc.filter((r) => fyOf(r.date, sm) === year);
    const by = (s: IncomeSource) => sum(inY.filter((r) => r.source === s).map((r) => r.amount));
    const donations = by("Donation"), auction = by("Auction"), sponsorCash = by("Sponsorship (cash)");
    const income = sum([donations, auction, sponsorCash]);
    const expenses = sum(d.expenses.filter((e) => fyOf(e.spent_on, sm) === year).map((e) => e.amount));
    const closing = r2(sum([opening, income]) - expenses);
    out.push({
      year, opening, donations, auction, sponsorCash, income, expenses, surplus: r2(income - expenses), closing: r2(closing),
      inKind: sum(d.sponsorships.filter((s) => s.kind === "in_kind" && s.status !== "cancelled" && fyOf(s.committed_on, sm) === year).map((s) => s.estimated_value)),
      pendingAuction: sum(d.lots.filter((l) => fyOf(l.auction_date, sm) === year).map(pendingAuction)),
      pendingSponsor: sum(d.sponsorships.filter((s) => fyOf(s.committed_on, sm) === year).map(pendingSponsorship)),
      explicitOpening: explicit,
    });
    carry = r2(closing);
  }
  return out;
}

export const inYear = <T>(rows: T[], dateOf: (r: T) => string, year: number | "all", sm: number) => (year === "all" ? rows : rows.filter((r) => fyOf(dateOf(r), sm) === year));

/* ---------- monthly series, categories, days ---------- */
export function monthlySeries(d: FinData, year: number) {
  const sm = d.startMonth, inc = incomeRows(d).filter((r) => fyOf(r.date, sm) === year), exp = d.expenses.filter((e) => fyOf(e.spent_on, sm) === year);
  return fyMonths(sm).map((m) => ({ month: m, label: MONTHS[m - 1], income: sum(inc.filter((r) => monthOf(r.date) === m).map((r) => r.amount)), expense: sum(exp.filter((e) => monthOf(e.spent_on) === m).map((e) => e.amount)) }));
}

export function categoryTotals(d: FinData, expenses: Expense[]) {
  const name = new Map(d.categories.map((c) => [c.id, c.name]));
  const map = new Map<string, { name: string; total: number; count: number }>();
  for (const e of expenses) {
    const n = name.get(e.category_id ?? "") ?? "Uncategorised";
    const cur = map.get(n) ?? { name: n, total: 0, count: 0 };
    cur.total = sum([cur.total, e.amount]); cur.count++; map.set(n, cur);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function dayGroups(d: FinData, expenses: Expense[]) {
  const name = new Map(d.categories.map((c) => [c.id, c.name]));
  const map = new Map<string, { date: string; items: (Expense & { category: string })[]; total: number }>();
  for (const e of [...expenses].sort((a, b) => b.spent_on.localeCompare(a.spent_on))) {
    const g = map.get(e.spent_on) ?? { date: e.spent_on, items: [], total: 0 };
    g.items.push({ ...e, category: name.get(e.category_id ?? "") ?? "Uncategorised" }); g.total = sum([g.total, e.amount]); map.set(e.spent_on, g);
  }
  return [...map.values()];
}

/* ---------- event-wise ---------- */
export interface EventFin { event_id: string | null; title: string; budget: number | null; donations: number; auction: number; sponsorCash: number; income: number; expenses: number; inKind: number; surplus: number; variance: number | null }

/** Every rupee lands in exactly one row (an event or "General"), so the rows always add up to the overall totals. */
export function eventFinancials(d: FinData, year: number | "all"): EventFin[] {
  const sm = d.startMonth, inc = inYear(incomeRows(d), (r) => r.date, year, sm), exp = inYear(d.expenses, (e) => e.spent_on, year, sm);
  const kind = inYear(d.sponsorships.filter((s) => s.kind === "in_kind" && s.status !== "cancelled"), (s) => s.committed_on, year, sm);
  const ids = new Set<string | null>([...inc.map((r) => r.event_id), ...exp.map((e) => e.event_id), ...kind.map((s) => s.event_id), ...d.budgets.map((b) => b.event_id)]);
  const rows: EventFin[] = [];
  for (const id of ids) {
    const ev = d.events.find((e) => e.id === id);
    if (id && year !== "all" && !inc.some((r) => r.event_id === id) && !exp.some((e) => e.event_id === id) && !kind.some((s) => s.event_id === id) && ev && fyOf(ev.starts_at.slice(0, 10), sm) !== year) continue;
    const i = inc.filter((r) => r.event_id === id), by = (s: IncomeSource) => sum(i.filter((r) => r.source === s).map((r) => r.amount));
    const income = sum(i.map((r) => r.amount)), expenses = sum(exp.filter((e) => e.event_id === id).map((e) => e.amount));
    const budget = id ? d.budgets.find((b) => b.event_id === id)?.budget ?? null : null;
    rows.push({ event_id: id, title: id ? ev?.title_te || ev?.title || "Event" : "General (not linked to an event)", budget: budget == null ? null : Number(budget), donations: by("Donation"), auction: by("Auction"), sponsorCash: by("Sponsorship (cash)"), income, expenses, inKind: sum(kind.filter((s) => s.event_id === id).map((s) => s.estimated_value)), surplus: r2(income - expenses), variance: budget == null ? null : r2(Number(budget) - expenses) });
  }
  return rows.sort((a, b) => (a.event_id === null ? 1 : 0) - (b.event_id === null ? 1 : 0) || b.expenses - a.expenses);
}

/* ---------- donors and sponsors ---------- */
export function donorReport(d: FinData, donations: Donation[]) {
  const map = new Map<string, { donor: Donor; total: number; count: number; first: string; last: string }>();
  let anon = { total: 0, count: 0 };
  for (const x of donations) {
    if (x.anonymous || !x.donor_id) { anon = { total: sum([anon.total, x.amount]), count: anon.count + 1 }; continue; }
    const donor = d.donors.find((y) => y.id === x.donor_id); if (!donor) continue;
    const c = map.get(donor.id) ?? { donor, total: 0, count: 0, first: x.received_on, last: x.received_on };
    c.total = sum([c.total, x.amount]); c.count++; c.first = x.received_on < c.first ? x.received_on : c.first; c.last = x.received_on > c.last ? x.received_on : c.last; map.set(donor.id, c);
  }
  return { donors: [...map.values()].sort((a, b) => b.total - a.total), anon };
}

export function sponsorReport(d: FinData, rows: Sponsorship[]) {
  return d.sponsors.map((sp) => {
    const mine = rows.filter((s) => s.sponsor_id === sp.id && s.status !== "cancelled");
    return {
      sponsor: sp, items: mine,
      cashReceived: sum(mine.filter((s) => s.kind === "cash").map((s) => s.received_amount)),
      cashCommitted: sum(mine.filter((s) => s.kind === "cash").map((s) => s.estimated_value)),
      inKind: sum(mine.filter((s) => s.kind === "in_kind").map((s) => s.estimated_value)),
      pending: sum(mine.map(pendingSponsorship)),
    };
  }).filter((r) => r.items.length).sort((a, b) => b.cashReceived + b.inKind - (a.cashReceived + a.inKind));
}

/* ---------- plain-language observations (rule based, not predictions) ---------- */
export function observations(d: FinData, year: number): string[] {
  const out: string[] = [];
  const ys = yearSummaries(d), cur = ys.find((y) => y.year === year), prev = ys.find((y) => y.year === year - 1);
  if (!cur) return ["No records for this year yet."];
  const exp = d.expenses.filter((e) => fyOf(e.spent_on, d.startMonth) === year), cats = categoryTotals(d, exp);
  if (cats[0] && cur.expenses > 0) out.push(`${cats[0].name} is the largest expense: ${money(cats[0].total)} (${Math.round((cats[0].total / cur.expenses) * 100)}% of spending).`);
  if (cur.income > 0 && cur.expenses > cur.income) out.push(`Spending (${money(cur.expenses)}) is higher than cash received (${money(cur.income)}) by ${money(r2(cur.expenses - cur.income))}. It is being covered from the opening balance.`);
  if (prev && prev.expenses >= 1000) { const ch = ((cur.expenses - prev.expenses) / prev.expenses) * 100; if (Math.abs(ch) >= 10) out.push(`Spending is ${Math.abs(Math.round(ch))}% ${ch > 0 ? "higher" : "lower"} than ${prev.year}.`); }
  if (prev && prev.income >= 1000) { const ch = ((cur.income - prev.income) / prev.income) * 100; if (Math.abs(ch) >= 10) out.push(`Cash received is ${Math.abs(Math.round(ch))}% ${ch > 0 ? "higher" : "lower"} than ${prev.year}.`); }
  const pend = sum([cur.pendingAuction, cur.pendingSponsor]);
  if (pend > 0) out.push(`${money(pend)} is still to be collected (auction ${money(cur.pendingAuction)}, sponsorship ${money(cur.pendingSponsor)}). Follow up before closing the year.`);
  const over = eventFinancials(d, year).filter((e) => e.variance != null && e.variance < 0);
  for (const e of over) out.push(`${e.title} is ${money(Math.abs(e.variance!))} over its budget.`);
  const noReceipt = exp.filter((e) => !e.receipt_url && e.amount >= 1000);
  if (noReceipt.length) out.push(`${noReceipt.length} expense${noReceipt.length > 1 ? "s" : ""} of ₹1,000 or more ${noReceipt.length > 1 ? "have" : "has"} no receipt attached.`);
  const uncategorised = exp.filter((e) => !e.category_id).length;
  if (uncategorised) out.push(`${uncategorised} expense${uncategorised > 1 ? "s have" : " has"} no category, which weakens the category breakdown.`);
  const { donors } = donorReport(d, d.donations.filter((x) => fyOf(x.received_on, d.startMonth) === year));
  if (donors.length > 1 && cur.donations > 0) { const top = donors[0]; const share = (top.total / cur.donations) * 100; if (share >= 40) out.push(`${top.donor.name} gave ${Math.round(share)}% of all donations. Consider widening the donor base.`); }
  return out.length ? out : ["Nothing unusual found for this year."];
}

/* ---------- CSV (UTF-8 with BOM so Excel shows Telugu and ₹ correctly) ---------- */
const cell = (v: unknown) => { let s = v == null ? "" : String(v); if (/^[=+\-@]/.test(s) && Number.isNaN(Number(s))) s = `'${s}`; return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const toCsv = (header: string[], rows: unknown[][]) => "\uFEFF" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
export function downloadCsv(name: string, header: string[], rows: unknown[][]) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([toCsv(header, rows)], { type: "text/csv;charset=utf-8" }));
  a.download = `${name}.csv`; a.click(); URL.revokeObjectURL(a.href);
}
