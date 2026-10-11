"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/client";

export default function PasswordField({ value, onChange, label, autoComplete }: { value: string; onChange: (v: string) => void; label: string; autoComplete: string }) {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  return (
    <label className="block text-sm text-burgundy/80">{label}
      <span className="relative mt-1 block">
        <input className="field !pr-16" type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} required minLength={8} autoComplete={autoComplete} />
        <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-3 text-xs font-semibold text-burgundy">{show ? t("auth.hide") : t("auth.show")}</button>
      </span>
    </label>
  );
}
