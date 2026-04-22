"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function PasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = getBrowserSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setReady(true);
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    const sb = getBrowserSupabase();
    if (!sb) return;
    setLoading(true);
    try {
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated.");
      router.replace("/dashboard");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-md mx-auto px-5 py-20">
        <div className="card">
          <h1 className="text-2xl font-semibold mb-1">Set a new password</h1>
          <p className="text-sm text-white/60 mb-6">
            Choose a strong password for your SiteScope account.
          </p>
          {ready ? (
            <form onSubmit={submit} className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/30 border border-white/10">
                <Lock className="w-4 h-4 text-white/50" />
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none"
                  placeholder="At least 8 characters"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save password"
                )}
              </button>
            </form>
          ) : (
            <Loader2 className="w-5 h-5 animate-spin text-white/60" />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
