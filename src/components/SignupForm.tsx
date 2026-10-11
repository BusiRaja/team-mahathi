"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { isConfigured, supabase } from "@/lib/supabase";
import { safeNext } from "@/lib/useSession";
import { useLang } from "@/lib/i18n/client";
import PasswordField from "./PasswordField";

/** Accepts 10-digit Indian mobiles with optional +91 / 0 prefix; returns +91XXXXXXXXXX or null. */
export function normalizePhone(raw: string): string | null {
  const d = raw.replace(/[\s()-]/g, "").replace(/^\+?91/, "").replace(/^0/, "");
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}

export default function SignupForm({ next, groupUrl }: { next: string; groupUrl: string }) {
  const { t } = useLang();
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"" | "confirm" | "ok">("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const phone = normalizePhone(f.phone);
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return setErr(t("auth.errEmail"));
    if (!phone) return setErr(t("auth.errPhone"));
    if (f.password.length < 8) return setErr(t("auth.errPassword"));
    if (f.password !== f.confirm) return setErr(t("auth.errMatch"));
    if (!supabase) return setErr(t("auth.needSupabase"));
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: { data: { phone, full_name: f.name.trim() }, emailRedirectTo: `${location.origin}/login` },
    });
    setBusy(false);
    if (error) return setErr(/registered|exists/i.test(error.message) ? t("auth.errExists") : t("auth.errGeneric"));
    if (data.user && data.user.identities?.length === 0) return setErr(t("auth.errExists")); // Supabase hides duplicates this way
    setDone(data.session ? "ok" : "confirm");
    if (data.session) router.refresh();
  }

  if (done) {
    return (
      <div className="royal-card mx-auto max-w-md space-y-4 p-6 text-center">
        <div aria-hidden className="text-5xl">🪔</div>
        <h1 className="section-title">{t("auth.welcome")}</h1>
        <p role="status" className="text-burgundy-dark/80">{done === "confirm" ? t("auth.checkEmail") : t("auth.signupSub")}</p>
        {done === "ok" ? <Link href={safeNext(next)} className="btn-royal w-full">{t("auth.continue")}</Link> : <Link href="/login" className="btn-royal w-full">{t("auth.login")}</Link>}
        {groupUrl && <a href={groupUrl} target="_blank" rel="noreferrer" className="btn-ghost w-full">{t("auth.joinGroup")}</a>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="royal-card mx-auto max-w-md space-y-4 p-6">
      <div className="text-center">
        <h1 className="section-title">{t("auth.signupTitle")}</h1>
        <p className="mt-1 text-sm text-burgundy/70">{t("auth.signupSub")}</p>
      </div>
      {!isConfigured && <p role="status" className="rounded-xl border border-saffron bg-saffron/15 p-3 text-center text-sm">{t("auth.needSupabase")}</p>}
      <label className="block text-sm text-burgundy/80">{t("auth.name")}
        <input className="field mt-1 font-telugu" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={60} autoComplete="name" />
      </label>
      <label className="block text-sm text-burgundy/80">{t("auth.email")}
        <input className="field mt-1" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required autoComplete="email" />
      </label>
      <label className="block text-sm text-burgundy/80">{t("auth.phone")}
        <input className="field mt-1" type="tel" inputMode="tel" placeholder="98765 43210" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required autoComplete="tel" />
      </label>
      <PasswordField label={t("auth.password")} value={f.password} onChange={(password) => setF({ ...f, password })} autoComplete="new-password" />
      <PasswordField label={t("auth.confirm")} value={f.confirm} onChange={(confirm) => setF({ ...f, confirm })} autoComplete="new-password" />
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <button className="btn-royal w-full" disabled={busy}>{busy ? t("auth.signingUp") : t("auth.signupButton")}</button>
      <p className="text-center text-sm text-burgundy/70">{t("auth.haveAccount")} <Link href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-burgundy">{t("auth.logInInstead")}</Link></p>
    </form>
  );
}
