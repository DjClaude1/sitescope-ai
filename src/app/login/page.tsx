"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Auth is not configured. Set NEXT_PUBLIC_SUPABASE_* env vars.");
      return;
    }
    const sb = getBrowserSupabase();
    if (!sb) return;
    setLoading(true);
    try {
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Check your inbox for the magic link");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-md mx-auto px-5 py-20">
        <div className="card">
          <h1 className="text-2xl font-semibold mb-1">Log in to SiteScope</h1>
          <p className="text-sm text-white/60 mb-6">
            We&apos;ll email you a magic link. No password.
          </p>
          {sent ? (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-200">
              Check {email} for your login link.
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/30 border border-white/10">
                <Mail className="w-4 h-4 text-white/50" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none"
                  placeholder="you@company.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                  </>
                ) : (
                  "Send magic link"
                )}
              </button>
            </form>
          )}
          {!isSupabaseConfigured && (
            <p className="text-xs text-white/40 mt-4">
              Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and
              NEXT_PUBLIC_SUPABASE_ANON_KEY to enable auth. You can still run
              audits without an account.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
