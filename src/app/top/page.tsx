import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NICHES } from "@/lib/seo/niches";
import { Trophy, ArrowRight } from "lucide-react";

export const runtime = "nodejs";
export const revalidate = 3600;

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL || "https://sitescope-ai-kappa.vercel.app"
  );
}

export const metadata: Metadata = {
  title: "Top websites by niche · SiteScope AI",
  description:
    "Browse AI-scored leaderboards of the top websites across SaaS, e-commerce, AI, fintech, dev tools, and more — SEO, performance, accessibility, conversion, and content.",
  alternates: { canonical: `${appUrl()}/top` },
  openGraph: {
    title: "Top websites by niche · SiteScope AI",
    description:
      "AI-scored leaderboards of the top websites across SaaS, e-commerce, AI, fintech, and more.",
    url: `${appUrl()}/top`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function TopIndexPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-5 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 chip mb-4">
            <Trophy className="w-4 h-4 text-amber-300" /> Leaderboards
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3">
            Top websites by niche.
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            AI-scored audits of the most-visited sites across {NICHES.length}{" "}
            niches. Every entry is graded on SEO, performance, accessibility,
            conversion, and content.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {NICHES.map((niche) => (
            <Link
              key={niche.slug}
              href={`/top/${niche.slug}`}
              className="card hover:border-white/20 transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-lg font-medium">{niche.label}</div>
                <ArrowRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
              </div>
              <div className="text-sm text-white/60">
                {niche.tagline}
              </div>
              <div className="text-xs text-white/40 mt-2">
                {niche.sites.length} sites ranked
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
