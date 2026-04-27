import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Crown,
  Target,
  TrendingUp,
  ShieldCheck,
  FlaskConical,
  Megaphone,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CROForm } from "@/components/CROForm";

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL || "https://sitescope-ai-kappa.vercel.app"
  );
}

export const metadata: Metadata = {
  title: "CRO Leak Analysis · find what's costing you revenue · SiteScope AI",
  description:
    "Senior-CRO-consultant audit of your site. Identifies revenue leaks, trust gaps, and conversion blockers — with concrete fixes, A/B test ideas, and revenue-impact estimates.",
  alternates: { canonical: `${appUrl()}/cro` },
  openGraph: {
    title: "CRO Leak Analysis · SiteScope AI",
    description:
      "Find the revenue leaks killing your conversions. Senior-CRO-consultant analysis in under a minute.",
    url: `${appUrl()}/cro`,
  },
  robots: { index: true, follow: true },
};

export default function CROLandingPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-5 pb-24">
        {/* HERO */}
        <section className="pt-16 md:pt-20 pb-10 text-center">
          <div className="inline-flex items-center gap-2 chip mb-6 text-amber-300 border-amber-500/30 bg-amber-500/5">
            <Crown className="w-4 h-4" /> Pro feature · senior-CRO-consultant
            analysis
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-5">
            Find the leaks{" "}
            <span className="bg-gradient-to-r from-brand to-brand-2 bg-clip-text text-transparent">
              costing you revenue
            </span>
            .
          </h1>
          <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto mb-8">
            A senior conversion-rate-optimization consultant reads your site and
            tells you exactly what&apos;s bleeding traffic, leads, and sales — with
            concrete fixes, revenue-impact estimates, and A/B test ideas.
          </p>
          <div id="run" className="max-w-2xl mx-auto">
            <CROForm />
          </div>
        </section>

        {/* WHAT YOU GET */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <div className="text-xs uppercase tracking-widest text-white/40 mb-2">
              What you get
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold">
              Not a checklist. Expert consulting advice.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <Feature
              icon={<AlertTriangle className="w-5 h-5" />}
              title="Top revenue leaks"
              desc="The 3–5 biggest issues, ranked by impact. What's lost (leads / trust / sales) and exactly how to fix each."
            />
            <Feature
              icon={<Target className="w-5 h-5" />}
              title="Conversion + trust audit"
              desc="Missing CTAs, weak value prop, confusing layout, no testimonials, missing trust signals — all surfaced."
            />
            <Feature
              icon={<TrendingUp className="w-5 h-5" />}
              title="Revenue impact estimate"
              desc="Realistic, business-focused estimate of what these leaks are costing — and what fixing them could unlock."
            />
            <Feature
              icon={<FlaskConical className="w-5 h-5" />}
              title="A/B test ideas"
              desc="2–4 specific control-vs-variant tests tied to your actual leaks. Stop guessing what to test."
            />
            <Feature
              icon={<Megaphone className="w-5 h-5" />}
              title="Positioning rewrites"
              desc="Sharper messaging and value-prop angles based on what your page is actually saying right now."
            />
            <Feature
              icon={<ShieldCheck className="w-5 h-5" />}
              title="Competitor-style insights"
              desc="What category leaders do that you don't — credibility cues, social proof patterns, copy moves."
            />
          </div>
        </section>

        {/* HOW IT'S DIFFERENT */}
        <section className="mb-16">
          <div className="card">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-2" /> How this is different
              from the standard SiteScope audit
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-white/75">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/40 mb-1">
                  Standard audit (free)
                </div>
                <ul className="space-y-1.5">
                  <li>· SEO, performance, accessibility, content</li>
                  <li>· 25+ technical heuristics</li>
                  <li>· Tech-focused recommendations</li>
                  <li>· Great for &ldquo;is my site healthy?&rdquo;</li>
                </ul>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-amber-300 mb-1">
                  CRO leak analysis (Pro)
                </div>
                <ul className="space-y-1.5">
                  <li>· Revenue leaks, conversion blockers, trust gaps</li>
                  <li>· Reads your copy, not just your tags</li>
                  <li>· Business-impact recommendations + A/B tests</li>
                  <li>· Great for &ldquo;what&apos;s actually costing me money?&rdquo;</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING NUDGE */}
        <section className="text-center">
          <div className="inline-flex flex-col items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-6 py-6 max-w-xl mx-auto">
            <Crown className="w-6 h-6 text-amber-300" />
            <p className="text-white/80">
              CRO leak analysis is included with{" "}
              <span className="text-white font-medium">SiteScope Pro</span> at
              $19/month. Sign in and upgrade once — run unlimited analyses.
            </p>
            <div className="flex gap-2">
              <Link href="/pricing" className="btn btn-primary">
                See Pro pricing
              </Link>
              <Link href="/login?next=/cro" className="btn btn-ghost">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-brand-2 mb-2">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-white/65 leading-relaxed">{desc}</p>
    </div>
  );
}
