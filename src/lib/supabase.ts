import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Browser/SSR features (auth, RLS-aware reads) need URL + anon key.
export const isSupabaseConfigured = Boolean(url && anonKey);
// Server-only features that need to bypass RLS (writing audits, usage
// counters, PayPal webhook, cron monitor) need the service role key.
export const isSupabaseAdminConfigured = Boolean(url && serviceKey);

let _browser: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (_browser) return _browser;
  _browser = createClient(url!, anonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _browser;
}

// Returns a service-role client or null. Does NOT fall back to the anon
// key — a client built from anon key is subject to RLS and would cause
// every write to silently no-op, which in turn would make billing,
// persistence, and monitoring fail in hard-to-diagnose ways.
export function getAdminSupabase(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  if (_admin) return _admin;
  _admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
