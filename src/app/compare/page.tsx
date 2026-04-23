import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CompareForm } from "./CompareForm";
import { FEATURED_PAIRS, UNIQUE_PAIRS } from "@/lib/seo/pairs";
import { Swords, ArrowRight, Trophy } from "lucide-react";

export const runtime = "nodejs";

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL || "https://sitescope-ai-kappa.vercel.app"
  );
}

export const metadata = {
  title: "Compare any two websites · SiteScope AI",
  description:
    "Run a side-by-side AI audit of any two websites — SEO, performance, accessibility, conversion, and content scored head-to-head.",
  alternates: { canonical: `${appUrl()}/compare` },
  openGraph: {
    title: "Compare any two websites · SiteScope AI",
    description:
      "Side-by-side AI audits: SEO, performance, accessibility, conversion, and content.",
    url: `${appUrl()}/compare`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function ComparePage() {
  // Surface up to 60 pairs on the hub page; the full list (~200+) is shipped
  // via sitemap.xml so Google can still discover the long tail.
  const extra = UNIQUE_PAIRS.filter(
    ([a, b]) =>
      !FEATURED_PAIRS.some(
        ([fa, fb]) =>
          (fa === a && fb === b) || (fa === b && fb === a),
      ),
  ).slice(0, 48);

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-5 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 chip mb-4">
            <Swords className="w-4 h-4" /> Side-by-side AI audits
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3">
            Compare any two websites.
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            Drop two URLs — we&apos;ll run a full audit on each and show you
            who wins on SEO, performance, accessibility, conversion, and
            content. Shareable URL for the result.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <CompareForm />
        </div>

        <section className="mt-16">
          <div className="flex items-center justify-center gap-2 mb-5">
            <Trophy className="w-4 h-4 text-amber-300" />
            <div className="text-xs uppercase tracking-widest text-white/40">
              popular matchups
            </div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {FEATURED_PAIRS.map(([a, b]) => (
              <Link
                key={`${a}-${b}`}
                href={`/compare/${a}/${b}`}
                className="card hover:border-white/20 transition group"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/90 font-medium truncate">
                    {a}
                  </span>
                  <span className="text-white/30 text-xs px-2">vs</span>
                  <span className="text-white/90 font-medium truncate">
                    {b}
                  </span>
                </div>
                <div className="mt-2 text-xs text-white/40 flex items-center gap-1">
                  View head-to-head
                  <ArrowRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="text-xs uppercase tracking-widest text-white/40 mb-3 text-center">
            more comparisons
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {extra.map(([a, b]) => (
              <Link
                key={`${a}-${b}`}
                href={`/compare/${a}/${b}`}
                className="chip hover:bg-white/10 transition inline-flex items-center gap-1.5 text-xs"
              >
                {a}
                <ArrowRight className="w-3 h-3 opacity-60" />
                {b}
              </Link>
            ))}
          </div>
          <div className="text-center mt-5 text-xs text-white/40">
            {UNIQUE_PAIRS.length}+ curated matchups available.{" "}
            <Link href="/top" className="underline hover:text-white/70">
              Browse by niche →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
