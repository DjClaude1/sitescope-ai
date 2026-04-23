import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScoreRing } from "@/components/ScoreRing";
import { runAudit } from "@/lib/audit";
import {
  findRecentAuditByHost,
  saveAuditPublic,
} from "@/lib/storage";
import type { AuditReport, CategoryScore } from "@/lib/types";
import { Trophy, ExternalLink, Swords, Sparkles } from "lucide-react";

export const runtime = "nodejs";
// Audits can take ~45s each. On Vercel the default serverless timeout is
// 10s (Hobby) or 15s (Pro) — allow up to 60s for the compare route.
export const maxDuration = 60;
// Re-run caching on the server (ISR) hourly for popular matchups.
export const revalidate = 3600;

// Hostname validation: letters, digits, dots, hyphens. Rejects paths,
// query strings, schemes. We normalize to lowercase without "www." before
// rendering / linking.
const HOST_RE = /^[a-z0-9][a-z0-9.-]{1,253}[a-z0-9]$/;

function normalizeHost(raw: string): string | null {
  const lowered = decodeURIComponent(raw).trim().toLowerCase().replace(/^www\./, "");
  if (!lowered.includes(".")) return null;
  if (!HOST_RE.test(lowered)) return null;
  return lowered;
}

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL || "https://sitescope-ai-kappa.vercel.app"
  );
}

async function auditForHost(host: string): Promise<AuditReport | null> {
  // Prefer a cached audit from the last 7 days; otherwise run fresh.
  const cached = await findRecentAuditByHost(host, 7);
  if (cached) return cached;
  try {
    const report = await runAudit(`https://${host}`);
    // Persist so subsequent compares (and /audit/<id>) can reuse it.
    await saveAuditPublic(report);
    return report;
  } catch (e) {
    console.error("[compare] audit failed for", host, e);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { a: string; b: string };
}): Promise<Metadata> {
  const a = normalizeHost(params.a);
  const b = normalizeHost(params.b);
  if (!a || !b || a === b) {
    return {
      title: "Compare · SiteScope AI",
      robots: { index: false, follow: true },
    };
  }
  const base = appUrl();
  const canonical = `${base}/compare/${a}/${b}`;
  const title = `${a} vs ${b} · AI website audit comparison`;
  const description = `Side-by-side AI audit: SEO, performance, accessibility, conversion, and content compared for ${a} and ${b}.`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

function WinnerPill({ diff }: { diff: number }) {
  if (Math.abs(diff) < 3) {
    return <span className="chip text-white/70">Too close to call</span>;
  }
  return (
    <span className="chip text-amber-300 inline-flex items-center gap-1.5">
      <Trophy className="w-3.5 h-3.5" /> Winner by {Math.abs(diff)} pts
    </span>
  );
}

function ScoreRow({
  label,
  aScore,
  bScore,
}: {
  label: string;
  aScore: number;
  bScore: number;
}) {
  const diff = aScore - bScore;
  const aWins = diff > 2;
  const bWins = diff < -2;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <div
        className={`text-right tabular-nums text-lg font-medium ${
          aWins ? "text-emerald-300" : "text-white/70"
        }`}
      >
        {aScore}
      </div>
      <div className="text-xs uppercase tracking-widest text-white/40 text-center min-w-[8rem]">
        {label}
      </div>
      <div
        className={`tabular-nums text-lg font-medium ${
          bWins ? "text-emerald-300" : "text-white/70"
        }`}
      >
        {bScore}
      </div>
    </div>
  );
}

function SiteCard({ report, host }: { report: AuditReport | null; host: string }) {
  if (!report) {
    return (
      <div className="card flex-1 text-center py-10 text-white/60">
        <div className="text-lg font-medium text-white mb-1">{host}</div>
        Could not audit this site right now (the server may have refused
        the request or the site is unreachable).
      </div>
    );
  }
  const topIssues = report.issues
    .filter((i) => i.severity !== "info")
    .slice(0, 3);
  return (
    <div className="card flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <a
            href={report.finalUrl || `https://${host}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold hover:underline inline-flex items-center gap-1.5"
          >
            {host} <ExternalLink className="w-4 h-4 opacity-60" />
          </a>
          {report.title && (
            <div className="text-xs text-white/40 truncate max-w-xs">
              {report.title}
            </div>
          )}
        </div>
        <ScoreRing value={report.overallScore} size={76} />
      </div>
      {topIssues.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-widest text-white/40 mb-2">
            Top issues
          </div>
          <ul className="space-y-1.5 text-sm text-white/70">
            {topIssues.map((i) => (
              <li key={i.id} className="line-clamp-2">
                · {i.title}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Link
        href={`/audit/${report.id}`}
        className="btn btn-ghost w-full justify-center text-sm"
      >
        Full report <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function scoreFor(scores: CategoryScore[] | undefined, key: string): number {
  return scores?.find((s) => s.category === key)?.score ?? 0;
}

export default async function ComparePair({
  params,
}: {
  params: { a: string; b: string };
}) {
  const a = normalizeHost(params.a);
  const b = normalizeHost(params.b);
  if (!a || !b || a === b) notFound();

  const [reportA, reportB] = await Promise.all([
    auditForHost(a),
    auditForHost(b),
  ]);

  const overallDiff =
    reportA && reportB ? reportA.overallScore - reportB.overallScore : 0;
  const winner =
    reportA && reportB
      ? Math.abs(overallDiff) < 3
        ? null
        : overallDiff > 0
          ? a
          : b
      : null;

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-5 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 chip mb-3">
            <Swords className="w-4 h-4" /> Compare
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
            {a} <span className="text-white/40">vs</span> {b}
          </h1>
          {winner ? (
            <p className="text-white/70">
              <span className="text-amber-300 font-medium">{winner}</span> wins
              by {Math.abs(overallDiff)} points overall.
            </p>
          ) : reportA && reportB ? (
            <p className="text-white/70">
              These two are neck-and-neck — within 3 points overall.
            </p>
          ) : (
            <p className="text-white/60">
              One or both sites could not be audited. Try different URLs.
            </p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <SiteCard report={reportA} host={a} />
          <SiteCard report={reportB} host={b} />
        </div>

        {reportA && reportB && (
          <div className="card mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Category breakdown</h2>
              <WinnerPill diff={overallDiff} />
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pb-2 border-b border-white/10 mb-2 text-sm">
              <div className="text-right font-medium">{a}</div>
              <div className="text-xs uppercase tracking-widest text-white/40 text-center min-w-[8rem]">
                Overall
              </div>
              <div className="font-medium">{b}</div>
            </div>
            <ScoreRow
              label="Overall"
              aScore={reportA.overallScore}
              bScore={reportB.overallScore}
            />
            {(
              ["seo", "performance", "accessibility", "conversion", "content"] as const
            ).map((key) => (
              <ScoreRow
                key={key}
                label={key}
                aScore={scoreFor(reportA.scores, key)}
                bScore={scoreFor(reportB.scores, key)}
              />
            ))}
          </div>
        )}

        {reportA && reportB && (
          <div className="card mb-10">
            <div className="flex items-center gap-2 mb-3 text-white/60">
              <Sparkles className="w-4 h-4 text-brand-2" />
              <span className="text-xs uppercase tracking-widest">
                AI summary
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-white/80">
              <div>
                <div className="font-medium mb-1">{a}</div>
                <p className="text-white/70">{reportA.aiSummary}</p>
              </div>
              <div>
                <div className="font-medium mb-1">{b}</div>
                <p className="text-white/70">{reportB.aiSummary}</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <Link href="/compare" className="btn btn-ghost">
            Compare a different pair
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
