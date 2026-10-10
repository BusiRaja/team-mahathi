import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key && !url.includes("YOUR-PROJECT"));

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(url as string, key as string)
  : null;

export const BUCKET = "festival-media";
