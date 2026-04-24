"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { AuditReport } from "@/lib/types";

// Ordered audit pipeline stages that match (roughly) the order the server
// works through the request. We step through them on a timer so users see
// tangible progress while the audit is running rather than a blank spinner.
const STAGES = [
  "Resolving host…",
  "Fetching page HTML…",
  "Parsing signals & metadata…",
  "Running 25+ heuristic checks…",
  "Asking Gemini for recommendations…",
  "Scoring & writing report…",
];

export function AuditForm({ compact }: { compact?: boolean }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-fill the URL from `?url=...` so links from /top/[niche] and embedded
  // share buttons can hand the user a one-click starting point. Reading
  // window.location directly avoids pulling in useSearchParams, which would
  // force this whole page out of static prerendering.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URL(window.location.href).searchParams.get("url");
    if (raw) setUrl(raw.slice(0, 500));
  }, []);

  // Cycle through the stage labels roughly every 4s while an audit is
  // running. We stop one short of the last stage so it never looks "done"
  // until the real response lands.
  useEffect(() => {
    if (!loading) {
      setStage(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 2));
    }, 4000);
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
      const res = await fetch("/api/audit", {
        method: "POST",
        headers,
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "LIMIT_REACHED") {
          toast.error("You've hit today's free audit limit. Upgrade to Pro for unlimited.");
          router.push("/pricing?reason=limit");
          return;
        }
        throw new Error(data.error || "Audit failed");
      }
      const report = data.report as AuditReport;
      // Cache to sessionStorage for direct view even when DB isn't configured.
      sessionStorage.setItem(`report:${report.id}`, JSON.stringify(report));
      router.push(`/audit/${report.id}`);
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
            placeholder="enter any website, e.g. stripe.com"
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
              <Loader2 className="w-5 h-5 animate-spin" /> Auditing…
            </>
          ) : (
            <>
              Run audit <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
      {loading && (
        <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-white/70 animate-[fadeIn_0.3s_ease-out]">
          <Loader2 className="w-4 h-4 animate-spin text-brand-2 shrink-0" />
          <span className="truncate">{STAGES[stage]}</span>
          <div className="ml-auto flex gap-1 shrink-0">
            {STAGES.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-4 rounded-full transition-all ${
                  i <= stage ? "bg-brand-2" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
