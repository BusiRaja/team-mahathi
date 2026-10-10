"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Subscribe() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) { setState("done"); return; } // preview mode
    setState("busy");
    const { error } = await supabase.from("subscribers").insert({ email: email.trim().toLowerCase() });
    setState(error && error.code !== "23505" ? "error" : "done");
  }
  return (
    <section className="mt-10 bg-blush">
      <div className="wrap flex flex-col items-center gap-3 py-5 md:flex-row md:justify-between">
        <div className="text-center md:text-left">
          <h2 className="font-display text-sm font-bold tracking-wide text-burgundy">Stay updated with Team Mahathi</h2>
          <p className="text-sm text-burgundy-dark/80">Get the latest event updates, photos and important announcements.</p>
        </div>
        {state === "done" ? <p role="status" className="font-medium text-burgundy">You&apos;re subscribed. Thank you!</p> : (
          <form onSubmit={submit} className="flex w-full max-w-md gap-2">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" aria-label="Email address" className="field" />
            <button className="btn-royal" disabled={state === "busy"}>{state === "busy" ? "Subscribing…" : "Subscribe"}</button>
          </form>
        )}
        {state === "error" && <p role="alert" className="text-sm text-red-700">Could not subscribe. Check the email and try again.</p>}
      </div>
    </section>
  );
}
