"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase";
import { safePath } from "@/lib/safePath";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// This page handles the redirect from Supabase after:
//   - Email confirmation on signup
//   - Password recovery
//   - (Future) OAuth providers
//
// Supabase supports two link styles:
//   1. PKCE (newer default): ?code=... — exchangeCodeForSession()
//   2. Implicit: #access_token=...&refresh_token=... — setSession()
// Both are handled here. A `next=` query param tells us where to send the
// user after the session is established.

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const sb = getBrowserSupabase();
      if (!sb) {
        setError("Auth is not configured on this deployment.");
        return;
      }
      const next = safePath(params.get("next"));
      const code = params.get("code");
      const errDesc =
        params.get("error_description") || params.get("error") || null;
      if (errDesc) {
        setError(errDesc);
        return;
      }

      try {
        if (code) {
          const { error } = await sb.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (
          typeof window !== "undefined" &&
          window.location.hash.includes("access_token=")
        ) {
          const hash = new URLSearchParams(window.location.hash.slice(1));
          const access_token = hash.get("access_token");
          const refresh_token = hash.get("refresh_token");
          if (access_token && refresh_token) {
            const { error } = await sb.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) throw error;
          } else {
            throw new Error("Incomplete auth response");
          }
        } else {
          // Nothing to exchange — let onAuthStateChange / existing session
          // decide. If the user is already signed in we still bounce them.
          const { data } = await sb.auth.getSession();
          if (!data.session) {
            setError("No verification code found. Try clicking the link again.");
            return;
          }
        }
        router.replace(next);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Verification failed");
      }
    };
    run();
  }, [params, router]);

  return (
    <>
      <Navbar />
      <main className="max-w-md mx-auto px-5 py-24">
        <div className="card text-center">
          {error ? (
            <>
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <h1 className="text-lg font-semibold mb-1">
                Couldn&apos;t finish sign in
              </h1>
              <p className="text-sm text-white/60 mb-4">{error}</p>
              <a href="/login" className="btn btn-primary inline-flex">
                Back to login
              </a>
            </>
          ) : (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-white/60 mx-auto mb-3" />
              <p className="text-sm text-white/60">Finishing sign in…</p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
