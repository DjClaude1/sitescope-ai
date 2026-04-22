"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { AuditReport } from "@/lib/types";

export function AuditForm({ compact }: { compact?: boolean }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
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
  );
}
