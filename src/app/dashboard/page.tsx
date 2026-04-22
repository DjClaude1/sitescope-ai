"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Crown, LogOut, Plus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuditForm } from "@/components/AuditForm";
import { ScoreRing } from "@/components/ScoreRing";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { AuditReport } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [audits, setAudits] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (search.get("upgraded") === "1") {
      toast.success("Welcome to Pro!");
    }
  }, [search]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const sb = getBrowserSupabase();
    if (!sb) return;
    (async () => {
      const { data: sess } = await sb.auth.getSession();
      if (!sess.session) {
        router.replace("/login");
        return;
      }
      const user = sess.session.user;
      setEmail(user.email || null);

      const { data: profile } = await sb
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.plan === "pro") setPlan("pro");

      const { data: rows } = await sb
        .from("audits")
        .select("report")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setAudits(((rows ?? []).map((r) => r.report) as AuditReport[]) || []);
      setLoading(false);
    })();
  }, [router]);

  async function signOut() {
    const sb = getBrowserSupabase();
    if (!sb) return;
    await sb.auth.signOut();
    router.push("/");
  }

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 py-10">
        {!isSupabaseConfigured ? (
          <div className="card text-center py-14">
            <div className="text-xl font-semibold mb-2">
              Dashboard needs auth
            </div>
            <p className="text-white/60 max-w-md mx-auto mb-6">
              Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to
              enable user accounts and audit history.
            </p>
            <Link href="/" className="btn btn-primary">
              Back to home
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/40 mb-1">
                  Dashboard
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold">
                  {email || "Your workspace"}
                </h1>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`chip ${plan === "pro" ? "text-amber-300 border-amber-500/30 bg-amber-500/10" : ""}`}
                  >
                    {plan === "pro" ? (
                      <>
                        <Crown className="w-3 h-3" /> Pro
                      </>
                    ) : (
                      "Free"
                    )}
                  </span>
                  {plan !== "pro" && (
                    <Link href="/pricing" className="text-xs text-brand-2 hover:underline">
                      Upgrade
                    </Link>
                  )}
                </div>
              </div>
              <button onClick={signOut} className="btn btn-ghost text-sm">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>

            <div className="card mb-8">
              <div className="flex items-center gap-2 mb-3 text-sm text-white/60">
                <Plus className="w-4 h-4" /> New audit
              </div>
              <AuditForm compact />
            </div>

            <h2 className="text-sm uppercase tracking-widest text-white/40 mb-3">
              Recent audits
            </h2>
            {loading ? (
              <div className="text-white/50">Loading…</div>
            ) : audits.length === 0 ? (
              <div className="card text-center py-12 text-white/60">
                No audits yet. Paste a URL above to get started.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {audits.map((a) => (
                  <Link
                    key={a.id}
                    href={`/audit/${a.id}`}
                    className="card hover:border-brand/40 transition"
                  >
                    <div className="flex items-center gap-4">
                      <ScoreRing value={a.overallScore} size={60} />
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {a.title || a.finalUrl}
                        </div>
                        <div className="text-xs text-white/50 truncate">
                          {a.finalUrl}
                        </div>
                        <div className="text-xs text-white/40 mt-0.5">
                          {new Date(a.fetchedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
