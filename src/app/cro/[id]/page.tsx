import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CROReportView } from "@/components/CROReportView";
import { getCROAnalysis } from "@/lib/cro-storage";

export const runtime = "nodejs";
export const revalidate = 300;

function hostOf(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL || "https://sitescope-ai-kappa.vercel.app"
  );
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const analysis = await getCROAnalysis(params.id);
  const base = appUrl();
  const canonical = `${base}/cro/${params.id}`;
  if (!analysis) {
    return {
      title: "CRO leak analysis · SiteScope AI",
      description:
        "Senior-CRO-consultant analysis of conversion leaks, trust gaps, and revenue impact.",
      alternates: { canonical },
      robots: { index: false, follow: true },
    };
  }
  const host = hostOf(analysis.finalUrl || analysis.url);
  const score = analysis.report.overall_score;
  const title = `${host} · CRO leak analysis (${score}/100) · SiteScope AI`;
  const description =
    analysis.report.summary?.slice(0, 180) ||
    `Senior-CRO-consultant analysis of ${host} — top revenue leaks, A/B test ideas, and concrete fixes.`;
  // Conservative indexing: only let the analysis pages into Google when the
  // score is reasonable; low-quality runs add noise to the index.
  const indexable = score >= 50;
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
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: indexable, follow: true },
  };
}

export default async function CROAnalysisPage({
  params,
}: {
  params: { id: string };
}) {
  const analysis = await getCROAnalysis(params.id);
  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 py-10">
        {analysis ? (
          <CROReportView analysis={analysis} />
        ) : (
          <NotFound />
        )}
      </main>
      <Footer />
    </>
  );
}

function NotFound() {
  return (
    <div className="card text-center">
      <h1 className="text-xl font-semibold mb-2">CRO analysis not found</h1>
      <p className="text-sm text-white/60 mb-4">
        This analysis might have expired from our cache, or the link is wrong.
      </p>
      <Link href="/cro" className="btn btn-primary">
        Run a new CRO analysis
      </Link>
    </div>
  );
}
