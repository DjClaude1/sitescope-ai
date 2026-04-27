"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Loader2, Crown, Sparkles } from "lucide-react";
import Link from "next/link";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";

const STAGES = [
  "Resolving host…",
  "Fetching page content…",
  "Reading copy, CTAs & trust signals…",
  "Looking for revenue leaks…",
  "Drafting CRO recommendations…",
  "Estimating impact & finalizing…",
];

export function CROForm({
  defaultUrl,
  compact,
}: {
  defaultUrl?: string;
  compact?: boolean;
}) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-fill from `?url=...` so cross-sell links from /audit/[id] hand the
  // user a one-click starting point on the CRO landing page.
  useEffect(() => {
    if (defaultUrl) return;
    if (typeof window === "undefined") return;
    const raw = new URL(window.location.href).searchParams.get("url");
    if (raw) setUrl(raw.slice(0, 500));
  }, [defaultUrl]);

  // Cycle through the stage labels while the analysis runs. CRO can take
  // 30–60s on Gemini because the prompt is large; users need progress.
  useEffect(() => {
    if (!loading) {
      setStage(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 2));
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setStage(0);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (isSupabaseConfigured) {
        const sb = getBrowserSupabase();
        const token = (await sb?.auth.getSession())?.data.session?.access_token;
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch("/api/cro", {
        method: "POST",
        headers,
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "AUTH_REQUIRED") {
          toast.error("Sign in to run a CRO leak analysis.");
          router.push(`/login?next=${encodeURIComponent("/cro")}`);
          return;
        }
        if (data.code === "PRO_REQUIRED") {
          toast.error("CRO analysis is a Pro feature. Upgrade to unlock.");
          router.push("/pricing?reason=cro");
          return;
        }
        throw new Error(data.error || "Analysis failed");
      }
      const id = data?.analysis?.id as string | undefined;
      if (!id) throw new Error("No analysis id returned");
      router.push(`/cro/${id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={submit}
        className={
          compact
            ? "flex flex-col sm:flex-row gap-2 w-full"
            : "glass rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row gap-3 glow"
        }
      >
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-black/30 border border-white/10">
          <Sparkles className="w-5 h-5 text-brand-2 shrink-0" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="enter your site, e.g. yourstore.com"
            className="flex-1 bg-transparent outline-none text-base placeholder:text-white/30"
            autoComplete="off"
            spellCheck={false}
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary px-6 py-3 text-base whitespace-nowrap disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Analyzing…
            </>
          ) : (
            <>
              <Crown className="w-4 h-4" /> Run CRO analysis{" "}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
      {loading && (
        <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-white/70">
          <Loader2 className="w-4 h-4 animate-spin text-brand-2 shrink-0" />
          {STAGES[stage]}
        </div>
      )}
      <p className="text-xs text-white/40 text-center">
        Pro feature · sign in & upgrade to run a real analysis ·{" "}
        <Link href="/pricing" className="text-brand-2 hover:underline">
          see pricing
        </Link>
      </p>
    </div>
  );
}
