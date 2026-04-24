import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NICHES, NICHE_BY_SLUG, type Niche } from "@/lib/seo/niches";
import { findRecentAuditByHost } from "@/lib/storage";
import type { AuditReport } from "@/lib/types";
import { Trophy, ArrowRight, ExternalLink, Sparkles } from "lucide-react";

export const runtime = "nodejs";
// Re-score the leaderboard at most once per hour.
export const revalidate = 3600;

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL || "https://sitescope-ai-kappa.vercel.app"
  );
}

export async function generateStaticParams() {
  return NICHES.map((n) => ({ niche: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { niche: string };
}): Promise<Metadata> {
  const niche = NICHE_BY_SLUG[params.niche];
  if (!niche) {
    return {
      title: "Top websites · SiteScope AI",
      robots: { index: false, follow: true },
    };
  }
  const base = appUrl();
  const canonical = `${base}/top/${niche.slug}`;
  const title = `Top ${niche.label} websites, ranked by AI audit · SiteScope AI`;
  const description = `${niche.description} Updated weekly.`;
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

interface Row {
  host: string;
  report: AuditReport | null;
}

async function fetchCached(niche: Niche): Promise<Row[]> {
  // Pull the most recent cached audit per host — DO NOT run fresh audits at
  // build/request time (each audit is 10s+ and there can be dozens per page).
  // If a site has never been audited, we surface a "Run audit" CTA so the
  // first visitor who cares kicks it off.
  const rows = await Promise.all(
    niche.sites.map(async (host) => ({
      host,
      report: await findRecentAuditByHost(host, 30),
    })),
  );
  // Sort: audited sites first (descending by score), then un-audited.
  rows.sort((a, b) => {
    const aScore = a.report?.overallScore ?? -1;
    const bScore = b.report?.overallScore ?? -1;
    return bScore - aScore;
  });
  return rows;
}

function Medal({ rank }: { rank: number }) {
  const style =
    rank === 1
      ? "bg-amber-300/15 text-amber-300 border-amber-300/30"
      : rank === 2
        ? "bg-white/10 text-white/80 border-white/20"
        : rank === 3
          ? "bg-orange-400/15 text-orange-300 border-orange-400/30"
          : "bg-white/5 text-white/60 border-white/10";
  return (
    <div
      className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-semibold tabular-nums ${style}`}
    >
      {rank}
    </div>
  );
}

function ScoreCell({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="text-white/40 text-sm tabular-nums">—</span>
    );
  }
  const color =
    value >= 85
      ? "text-emerald-300"
      : value >= 70
        ? "text-white"
        : value >= 50
          ? "text-amber-300"
          : "text-rose-300";
  return (
    <span className={`${color} tabular-nums text-lg font-medium`}>{value}</span>
  );
}

export default async function TopNichePage({
  params,
}: {
  params: { niche: string };
}) {
  const niche = NICHE_BY_SLUG[params.niche];
  if (!niche) notFound();
  const rows = await fetchCached(niche);
  const audited = rows.filter((r) => r.report);
  const topScore = audited[0]?.report?.overallScore ?? null;

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-5 py-10">
        <nav className="text-xs text-white/40 mb-4">
          <Link href="/top" className="hover:text-white/70">
            All niches
          </Link>{" "}
          <span className="opacity-60">/</span> {niche.label}
        </nav>
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 chip mb-3">
            <Trophy className="w-4 h-4 text-amber-300" /> {niche.label}{" "}
            leaderboard
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-3">
            Top {niche.label} websites, ranked by AI audit.
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            {niche.description}
          </p>
          {topScore !== null && (
            <p className="text-white/50 text-sm mt-3">
              Current top score: <span className="text-amber-300 font-medium">{topScore}/100</span> ·{" "}
              {audited.length} of {rows.length} sites scored
            </p>
          )}
        </div>

        <div className="card divide-y divide-white/5">
          {rows.map((row, i) => (
            <div
              key={row.host}
              className="py-3 first:pt-0 last:pb-0 grid grid-cols-[auto_1fr_auto_auto] items-center gap-3"
            >
              <Medal rank={i + 1} />
              <div className="min-w-0">
                <div className="font-medium truncate">{row.host}</div>
                {row.report?.title && (
                  <div className="text-xs text-white/40 truncate">
                    {row.report.title}
                  </div>
                )}
              </div>
              <ScoreCell value={row.report?.overallScore ?? null} />
              {row.report ? (
                <Link
                  href={`/audit/${row.report.id}`}
                  className="btn btn-ghost text-xs hidden sm:inline-flex"
                >
                  Report <ExternalLink className="w-3 h-3" />
                </Link>
              ) : (
                <Link
                  href={`/?url=${encodeURIComponent(`https://${row.host}`)}`}
                  className="btn btn-ghost text-xs hidden sm:inline-flex opacity-70 hover:opacity-100"
                >
                  <Sparkles className="w-3 h-3" /> Audit
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center space-y-3">
          <div className="text-sm text-white/50">
            Want to see how your site stacks up?
          </div>
          <Link href="/" className="btn btn-primary inline-flex items-center gap-1.5">
            Audit my site <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-10">
          <div className="text-xs uppercase tracking-widest text-white/40 mb-3 text-center">
            Other leaderboards
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {NICHES.filter((n) => n.slug !== niche.slug).map((n) => (
              <Link
                key={n.slug}
                href={`/top/${n.slug}`}
                className="chip hover:bg-white/10 transition"
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
