"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useSession";
import { useLang } from "@/lib/i18n/client";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

const toKey = (b64: string) => {
  const raw = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

/** Bell button: turns push notifications on or off for this device. Only for signed-in users. */
export default function PushToggle() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [state, setState] = useState<"hidden" | "off" | "on" | "blocked" | "busy">("hidden");
  const uid = user?.id;

  const current = useCallback(async () => {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    return reg?.pushManager.getSubscription() ?? null;
  }, []);

  useEffect(() => {
    if (!uid || !KEY || !supabase || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) { setState("hidden"); return; }
    if (Notification.permission === "denied") { setState("blocked"); return; }
    current().then(async (sub) => {
      setState(sub ? "on" : "off");
      // Keep the device's language in step with the site so pushes arrive in the right language.
      if (sub) await supabase!.from("push_subscriptions").update({ lang }).eq("endpoint", sub.endpoint);
    });
  }, [uid, lang, current]);

  async function toggle() {
    if (!supabase || !uid || state === "busy") return;
    const prev = state;
    setState("busy");
    try {
      if (prev === "on") {
        const sub = await current();
        if (sub) { await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint); await sub.unsubscribe(); }
        return setState("off");
      }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState(perm === "denied" ? "blocked" : "off");
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(KEY!) }));
      const j = sub.toJSON();
      const { error } = await supabase.from("push_subscriptions").upsert(
        { user_id: uid, endpoint: sub.endpoint, p256dh: j.keys?.p256dh ?? "", auth: j.keys?.auth ?? "", lang },
        { onConflict: "endpoint" }
      );
      if (error) throw error;
      setState("on");
    } catch {
      setState(prev === "on" ? "on" : "off");
    }
  }

  if (state === "hidden") return null;
  const label = state === "on" ? t("push.disable") : state === "blocked" ? t("push.blocked") : t("push.enable");
  return (
    <button
      onClick={toggle}
      disabled={state === "blocked" || state === "busy"}
      aria-pressed={state === "on"}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-base sm:h-9 sm:w-9 ${state === "on" ? "border-burgundy bg-burgundy text-white" : "border-burgundy/40 text-burgundy hover:bg-burgundy/5"} disabled:opacity-50`}
    >
      <span aria-hidden>{state === "on" ? "🔔" : "🔕"}</span>
    </button>
  );
}
