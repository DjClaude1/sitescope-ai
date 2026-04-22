import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuditForm } from "@/components/AuditForm";
import {
  Rocket,
  ShieldCheck,
  Search,
  Zap,
  Users,
  Eye,
  ListChecks,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 pb-24">
        {/* HERO */}
        <section className="pt-16 md:pt-24 pb-12 text-center">
          <div className="inline-flex items-center gap-2 chip mb-6">
            <Sparkle /> AI-powered website audits · free to start
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-5">
            Audit any website in{" "}
            <span className="bg-gradient-to-r from-brand to-brand-2 bg-clip-text text-transparent">
              under a minute
            </span>
            .
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10">
            SiteScope AI scans SEO, performance, accessibility, conversion and content —
            then writes the fixes a senior consultant would charge $500+ for. Built on
            Gemini. Deploy on Vercel free tier.
          </p>
          <div id="run" className="max-w-2xl mx-auto">
            <AuditForm />
            <div className="flex items-center justify-center gap-6 mt-5 text-xs text-white/50">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> no signup
                required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 3 free audits /
                day
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> shareable
                reports
              </span>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF / SAMPLE URLS */}
        <section className="mb-20">
          <div className="text-center text-xs uppercase tracking-widest text-white/40 mb-4">
            try a demo
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {["stripe.com", "vercel.com", "linear.app", "notion.so", "github.com"].map(
              (d) => (
                <Link
                  key={d}
                  href={`/?demo=${d}#run`}
                  className="chip hover:bg-white/10 transition"
                >
                  {d}
                </Link>
              )
            )}
          </div>
        </section>

        {/* FEATURES */}
        <section className="grid md:grid-cols-3 gap-4 mb-20">
          <Feature
            icon={<Search className="w-5 h-5" />}
            title="SEO audit"
            desc="Title, meta, canonical, schema, headings, OG, Twitter — prioritized."
          />
          <Feature
            icon={<Zap className="w-5 h-5" />}
            title="Performance signals"
            desc="HTML size, script bloat, render-blocking CSS, TTFB — caught early."
          />
          <Feature
            icon={<Eye className="w-5 h-5" />}
            title="Accessibility"
            desc="Alt text coverage, viewport, lang attributes, semantic headings."
          />
          <Feature
            icon={<Rocket className="w-5 h-5" />}
            title="Conversion review"
            desc="CTA coverage, trust signals, analytics, contact paths."
          />
          <Feature
            icon={<ListChecks className="w-5 h-5" />}
            title="Content analysis"
            desc="Depth, relevance, and AI-written rewrites of weak sections."
          />
          <Feature
            icon={<ShieldCheck className="w-5 h-5" />}
            title="Actionable fixes"
            desc="Every issue comes with the exact code or copy to paste in."
          />
        </section>

        {/* HOW IT WORKS */}
        <section className="mb-20">
          <SectionTitle
            eyebrow="How it works"
            title="Three steps. One shareable report."
          />
          <div className="grid md:grid-cols-3 gap-4">
            <Step
              n={1}
              title="Paste a URL"
              desc="Any public website. No install, no script tag, no waiting for DNS."
            />
            <Step
              n={2}
              title="AI scans the page"
              desc="We parse signals + feed them to Gemini with a senior-consultant prompt."
            />
            <Step
              n={3}
              title="Get a scored report"
              desc="5 category scores, ranked issues, quick-win recommendations — shareable."
            />
          </div>
        </section>

        {/* LUCRATIVE USE CASES */}
        <section className="mb-20">
          <SectionTitle
            eyebrow="Who pays for this"
            title="Built for people who sell audits."
          />
          <div className="grid md:grid-cols-2 gap-4">
            <UseCase
              icon={<Users className="w-5 h-5" />}
              title="Agencies & freelancers"
              desc="Run 20 prospect audits in an hour, send them in your branded PDF, close retainers."
            />
            <UseCase
              icon={<Rocket className="w-5 h-5" />}
              title="Founders & indie hackers"
              desc="Ship your landing page, run SiteScope, fix the quick wins before you spend on ads."
            />
            <UseCase
              icon={<Search className="w-5 h-5" />}
              title="SEO consultants"
              desc="Use the report as your kickoff deliverable. Clients love the scores."
            />
            <UseCase
              icon={<Eye className="w-5 h-5" />}
              title="E-commerce teams"
              desc="Audit product pages weekly, catch regressions before they hurt revenue."
            />
          </div>
        </section>

        {/* PRICING TEASER */}
        <section className="mb-20">
          <div className="card flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="chip mb-3">Pro · $19/mo</div>
              <h3 className="text-2xl font-semibold mb-2">
                Unlimited audits, PDF export, weekly monitoring.
              </h3>
              <p className="text-white/60 max-w-xl">
                Agencies recoup Pro after closing a single client. Cancel anytime.
                PayPal billing — no credit card stored.
              </p>
            </div>
            <Link href="/pricing" className="btn btn-primary px-6 py-3">
              See pricing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mb-10">
          <SectionTitle eyebrow="FAQ" title="Questions, answered." />
          <div className="grid md:grid-cols-2 gap-4">
            <Faq
              q="Do I need an API key?"
              a="Not to use the hosted version. If self-hosting, drop a free Gemini API key into .env and deploy to Vercel — that's it."
            />
            <Faq
              q="Will this replace Lighthouse / Ahrefs?"
              a="It complements them. We focus on the human-readable, consultant-grade recommendations you can actually act on in under an hour."
            />
            <Faq
              q="Is my audit data private?"
              a="Audits are stored with a random ID and are accessible to anyone with the link. Sensitive internal pages should not be audited against public storage."
            />
            <Faq
              q="Can I white-label the reports?"
              a="On the Pro plan, yes. Custom logo, colors, and branded PDF export."
            />
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
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand/40 to-brand-2/30 flex items-center justify-center mb-4">
        {icon}
      </div>
      <div className="font-medium mb-1">{title}</div>
      <div className="text-sm text-white/60">{desc}</div>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="card">
      <div className="text-5xl font-semibold text-white/10 mb-2">0{n}</div>
      <div className="font-medium mb-1">{title}</div>
      <div className="text-sm text-white/60">{desc}</div>
    </div>
  );
}

function UseCase({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand/40 to-brand-2/30 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="font-medium mb-1">{title}</div>
        <div className="text-sm text-white/60">{desc}</div>
      </div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="card">
      <div className="font-medium mb-1">{q}</div>
      <div className="text-sm text-white/60">{a}</div>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-6">
      <div className="text-xs uppercase tracking-widest text-white/40 mb-2">
        {eyebrow}
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold">{title}</h2>
    </div>
  );
}

function Sparkle() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2l1.8 5.2 5.2 1.8-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
    </svg>
  );
}
