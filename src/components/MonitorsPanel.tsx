"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, Loader2, Plus, Trash2, Crown } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase";

interface Monitor {
  id: string;
  url: string;
  last_score: number | null;
  last_audited_at: string | null;
  created_at: string;
}

interface Props {
  plan: "free" | "pro";
}

// Pro-only panel on the dashboard. Users add up to N monitored URLs; the
// weekly cron (vercel.json) re-audits them and emails a delta alert.
export function MonitorsPanel({ plan }: Props) {
  const [monitors, setMonitors] = useState<Monitor[] | null>(null);
  const [max, setMax] = useState<number>(6);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const authFetch = useCallback(
    async (input: RequestInfo, init?: RequestInit) => {
      const sb = getBrowserSupabase();
      const { data } = sb ? await sb.auth.getSession() : { data: null };
      const token = data?.session?.access_token;
      return fetch(input, {
        ...init,
        headers: {
          ...(init?.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });
    },
    []
  );

  const refresh = useCallback(async () => {
    const r = await authFetch("/api/monitors");
    if (r.ok) {
      const j = await r.json();
      setMonitors(j.monitors || []);
      if (typeof j.max === "number") setMax(j.max);
    }
  }, [authFetch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    try {
      const r = await authFetch("/api/monitors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: /^https?:\/\//i.test(url) ? url : "https://" + url,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (j.error === "pro_required") toast.error("Monitors are a Pro feature.");
        else if (j.error === "invalid_url") toast.error("Enter a valid URL.");
        else if (j.error === "limit_reached")
          toast.error(`You've reached the ${max}-monitor limit.`);
        else toast.error("Could not add monitor.");
        return;
      }
      if (j.dedup) toast.info("Already monitoring that URL.");
      else toast.success("Monitor added. We'll re-audit it weekly.");
      setUrl("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const r = await authFetch(`/api/monitors?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (r.ok) {
      toast.success("Monitor removed.");
      await refresh();
    } else {
      toast.error("Could not remove monitor.");
    }
  }

  return (
    <div className="card mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Bell className="w-4 h-4" /> Weekly monitors
        </div>
        <div className="text-xs text-white/40">
          {monitors?.length ?? 0} / {max}
        </div>
      </div>
      {plan !== "pro" ? (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-sm text-white/70">
            <span className="inline-flex items-center gap-1 text-amber-300 font-medium">
              <Crown className="w-3.5 h-3.5" /> Pro
            </span>{" "}
            unlocks weekly re-audits + email alerts when your score changes.
          </div>
          <Link href="/pricing" className="btn btn-primary text-sm whitespace-nowrap">
            Upgrade
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={add} className="flex gap-2 mb-4">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/30 border border-white/10">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-site.com"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/30"
                disabled={busy}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary text-sm"
              disabled={busy || !url.trim()}
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add
            </button>
          </form>
          {monitors === null ? (
            <div className="text-sm text-white/50">Loading…</div>
          ) : monitors.length === 0 ? (
            <div className="text-sm text-white/50">
              No monitors yet. Add a URL above to get a weekly email when the
              score changes by ≥3 points.
            </div>
          ) : (
            <ul className="space-y-2">
              {monitors.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm truncate">{m.url}</div>
                    <div className="text-xs text-white/40">
                      {m.last_audited_at
                        ? `Last: ${m.last_score ?? "—"}/100 · ${new Date(m.last_audited_at).toLocaleDateString()}`
                        : "Not audited yet — runs on the next weekly cron."}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(m.id)}
                    className="btn btn-ghost text-xs"
                    aria-label="Remove monitor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
