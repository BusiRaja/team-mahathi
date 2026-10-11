"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/** null while checking, then true/false. Without Supabase configured nobody can sign in, so it resolves to false. */
export function useSignedIn(): boolean | null {
  const { user, loading } = useAuth();
  return loading ? null : Boolean(user);
}

export const displayName = (u: User | null) =>
  (u?.user_metadata?.full_name as string | undefined)?.trim() || u?.email?.split("@")[0] || "";

/** Current user plus whether they are an admin. `loading` is true until the first session check finishes. */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let live = true;
    supabase.auth.getSession().then(({ data }) => { if (live) { setUser(data.session?.user ?? null); setLoading(false); } });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => { live = false; sub.subscription.unsubscribe(); };
  }, []);

  const uid = user?.id;
  useEffect(() => {
    if (!supabase || !uid) { setIsAdmin(false); return; }
    let live = true;
    supabase.from("admins").select("user_id").eq("user_id", uid).maybeSingle().then(({ data }) => { if (live) setIsAdmin(Boolean(data)); });
    return () => { live = false; };
  }, [uid]);

  return { user, isAdmin, loading };
}

/** Only allow same-site paths as a post-login destination. */
export const safeNext = (n: string | null | undefined) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/");
