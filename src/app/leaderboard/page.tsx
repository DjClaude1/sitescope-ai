import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { listTopPublicAudits } from "@/lib/storage";
import { Trophy, ExternalLink } from "lucide-react";

export const runtime = "nodejs";
export const revalidate = 300;
export const metadata = {
  title: "Leaderboard — Top audited sites · SiteScope AI",
  description:
    "The highest-scoring websites audited on SiteScope AI in the last 7 days. See who built the cleanest page this week.",
};

function scoreColor(score: number) {
  if (score >= 90) return "text-emerald-300 border-emerald-500/40 bg-emerald-500/10";
  if (score >= 80) return "text-emerald-300 border-emerald-500/30 bg-emerald-500/5";
  if (score >= 60) return "text-amber-300 border-amber-500/30 bg-amber-500/5";
  return "text-rose-300 border-rose-500/30 bg-rose-500/5";
}

function hostOf(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}

export default async function LeaderboardPage() {
  const rows = await listTopPublicAudits(30, 7);
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-5 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 chip mb-4">
            <Trophy className="w-4 h-4" /> Live · last 7 days
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3">
            Top audited sites
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            The cleanest pages we&apos;ve scored this week. Run your own audit
            and see where you land.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="card text-center text-white/60">
            No audits yet this week. Be the first — run one from the{" "}
            <Link href="/" className="text-brand-2 hover:underline">
              home page
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((a, i) => {
              const host = hostOf(a.finalUrl || a.url);
              return (
                <Link
                  key={a.id}
                  href={`/audit/${a.id}`}
                  className="card flex items-center gap-4 hover:bg-white/10 transition !py-4"
                >
                  <div className="w-10 text-center text-xl font-semibold text-white/30 tabular-nums">
                    {i + 1}
                  </div>
                  <div
                    className={`w-14 h-14 rounded-xl border flex items-center justify-center text-xl font-semibold tabular-nums ${scoreColor(a.overallScore)}`}
                  >
                    {a.overallScore}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{host}</div>
                    {a.title && (
                      <div className="text-xs text-white/50 truncate">
                        {a.title}
                      </div>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/30 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
