import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuditReportView } from "@/components/AuditReportView";
import { getAudit } from "@/lib/storage";
import { ClientFallback } from "./ClientFallback";

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
  const report = await getAudit(params.id);
  const base = appUrl();
  const canonical = `${base}/audit/${params.id}`;
  if (!report) {
    return {
      title: "Audit report · SiteScope AI",
      description:
        "AI-powered website audit — SEO, performance, accessibility, conversion, and content analysis.",
      alternates: { canonical },
      robots: { index: false, follow: true },
    };
  }
  const host = hostOf(report.finalUrl || report.url);
  const title = `${host} scored ${report.overallScore}/100 · SiteScope AI`;
  const description =
    report.aiSummary?.slice(0, 180) ||
    `AI audit of ${host} — SEO, performance, accessibility, conversion and content. Overall score ${report.overallScore}/100.`;
  const ogImage = `${base}/audit/${params.id}/opengraph-image`;
  // Only allow indexing of reasonably clean public reports; low-quality
  // pages add noise to the index and can invite abuse (e.g. slurs in URLs
  // that end up in titles). Threshold is intentionally conservative.
  const indexable = report.overallScore >= 60;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: { index: indexable, follow: true },
  };
}

export default async function AuditPage({
  params,
}: {
  params: { id: string };
}) {
  const report = await getAudit(params.id);
  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 py-10">
        {report ? (
          <AuditReportView report={report} />
        ) : (
          <ClientFallback id={params.id} />
        )}
      </main>
      <Footer />
    </>
  );
}
