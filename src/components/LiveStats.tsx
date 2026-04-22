"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { PublicAuditSummary } from "@/lib/storage";

interface StatsPayload {
  total: number;
  recent: PublicAuditSummary[];
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-300";
  if (score >= 60) return "text-amber-300";
  return "text-rose-300";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.max(1, Math.floor(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function hostOf(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}

export function LiveStats() {
  const [stats, setStats] = useState<StatsPayload | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as StatsPayload;
        if (alive) setStats(data);
      } catch {
        // Ignore — this is a progressive-enhancement widget.
      }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (!stats || stats.recent.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-center gap-2 mb-5 text-sm text-white/60">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        <span>
          <span className="font-semibold text-white">
            {stats.total.toLocaleString()}
          </span>{" "}
          sites audited · live
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 justify-start md:justify-center scrollbar-none">
        {stats.recent.map((a) => (
          <Link
            key={a.id}
            href={`/audit/${a.id}`}
            className="shrink-0 card !p-3 hover:bg-white/10 transition flex items-center gap-3 min-w-[220px]"
          >
            <div
              className={`text-2xl font-semibold tabular-nums ${scoreColor(a.overallScore)}`}
            >
              {a.overallScore}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {hostOf(a.finalUrl || a.url)}
              </div>
              <div className="text-xs text-white/40">
                {timeAgo(a.createdAt)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
