import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True only when both env vars are actually set. Auth/history UI checks
 * this and shows a plain "not set up yet" message instead of letting a
 * misconfigured deployment fail with a confusing network error - the same
 * pattern gemini.ts / tavily.ts use for their own missing-key case.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

// createClient validates its URL immediately and throws if it's not a
// real URL, so a placeholder is used when the env vars are missing rather
// than an empty string - isSupabaseConfigured is what actually gates
// whether any of this is used.
export const supabase = createClient(
  url && anonKey ? url : "https://placeholder.supabase.co",
  url && anonKey ? anonKey : "placeholder-anon-key"
);
