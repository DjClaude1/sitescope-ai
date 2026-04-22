"use client";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Loader2, Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";

type Mode = "signin" | "signup";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") || "/dashboard";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Auth is not configured. Set NEXT_PUBLIC_SUPABASE_* env vars.");
      return;
    }
    const sb = getBrowserSupabase();
    if (!sb) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        });
        if (error) throw error;
        // If email confirmation is enabled (default), there's no session
        // yet — user must click the link in their inbox.
        if (!data.session) {
          setConfirmSent(true);
          toast.success("Account created. Check your inbox to confirm.");
          return;
        }
        toast.success("Welcome!");
        router.replace(nextPath);
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        router.replace(nextPath);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  async function forgotPassword() {
    if (!email) {
      toast.error("Enter your email above first.");
      return;
    }
    const sb = getBrowserSupabase();
    if (!sb) return;
    setLoading(true);
    try {
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/account/password`,
      });
      if (error) throw error;
      setResetSent(true);
      toast.success("Password reset email sent.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-md mx-auto px-5 py-20">
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === "signin"
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === "signup"
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              Create account
            </button>
          </div>

          <h1 className="text-2xl font-semibold mb-1">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-white/60 mb-6">
            {mode === "signin"
              ? "Sign in to view your audit history and Pro features."
              : "Get 3 free audits/day. Upgrade to Pro any time."}
          </p>

          {confirmSent ? (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-200">
              Check {email} for a confirmation link. After you click it you&apos;ll
              be redirected back here and logged in automatically.
            </div>
          ) : resetSent ? (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-200">
              Password reset email sent to {email}. Click the link to set a new
              password.
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/30 border border-white/10">
                <Mail className="w-4 h-4 text-white/50" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none"
                  placeholder="you@company.com"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/30 border border-white/10">
                <Lock className="w-4 h-4 text-white/50" />
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none"
                  placeholder={
                    mode === "signin" ? "Your password" : "At least 8 characters"
                  }
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Working…
                  </>
                ) : mode === "signin" ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </button>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={forgotPassword}
                  disabled={loading}
                  className="w-full text-xs text-white/50 hover:text-white/80 pt-1"
                >
                  Forgot password?
                </button>
              )}
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
