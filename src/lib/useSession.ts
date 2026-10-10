"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

/** null while checking, then true/false. Without Supabase configured nobody can sign in, so it resolves to false. */
export function useSignedIn(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    if (!supabase) { setSignedIn(false); return; }
    let live = true;
    supabase.auth.getSession().then(({ data }) => { if (live) setSignedIn(Boolean(data.session)); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(Boolean(session)));
    return () => { live = false; sub.subscription.unsubscribe(); };
  }, []);
  return signedIn;
}
