"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { isConfigured, supabase } from "@/lib/supabase";
import { safeNext } from "@/lib/useSession";
import { useLang } from "@/lib/i18n/client";
import PasswordField from "./PasswordField";

export default function LoginForm({ next }: { next: string }) {
  const { t } = useLang();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return setErr(t("auth.needSupabase"));
    setBusy(true); setErr("");
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      return setErr(/confirm/i.test(error.message) ? t("auth.errUnconfirmed") : /invalid/i.test(error.message) ? t("auth.errInvalid") : t("auth.errGeneric"));
    }
    // Admins land on the admin panel unless they were sent here from another page.
    const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
    router.replace(safeNext(next) !== "/" ? safeNext(next) : admin ? "/admin" : "/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="royal-card mx-auto max-w-md space-y-4 p-6">
      <div className="text-center">
        <h1 className="section-title">{t("auth.loginTitle")}</h1>
        <p className="mt-1 text-sm text-burgundy/70">{t("auth.loginSub")}</p>
      </div>
      {!isConfigured && <p role="status" className="rounded-xl border border-saffron bg-saffron/15 p-3 text-center text-sm">{t("auth.needSupabase")}</p>}
      <label className="block text-sm text-burgundy/80">{t("auth.email")}
        <input className="field mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </label>
      <PasswordField label={t("auth.password")} value={password} onChange={setPassword} autoComplete="current-password" />
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <button className="btn-royal w-full" disabled={busy}>{busy ? t("auth.loggingIn") : t("auth.loginButton")}</button>
      <p className="text-center text-sm text-burgundy/70">{t("auth.noAccount")} <Link href={`/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-burgundy">{t("auth.createAccount")}</Link></p>
    </form>
  );
}
