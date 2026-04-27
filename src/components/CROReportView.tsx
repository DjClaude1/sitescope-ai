"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ExternalLink,
  Share2,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Search,
  Zap,
  FlaskConical,
  Megaphone,
  Target,
  Rocket,
  ChevronRight,
} from "lucide-react";
import { ScoreRing } from "./ScoreRing";
import {
  type CROAnalysis,
  type Impact,
  leakLabel,
  leakFix,
  leakImpact,
} from "@/lib/cro-shared";

function ImpactBadge({ impact }: { impact: Impact | null }) {
  if (!impact) return null;
  const map: Record<Impact, { className: string; Icon: typeof AlertTriangle }> = {
    high: {
      className: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      Icon: AlertTriangle,
    },
    medium: {
      className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      Icon: AlertCircle,
    },
    low: {
      className: "bg-sky-500/15 text-sky-300 border-sky-500/30",
      Icon: Info,
    },
  };
  const { className, Icon } = map[impact];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${className}`}
    >
      <Icon className="w-3 h-3" /> {impact}
    </span>
  );
}

function CategorySection({
  title,
  Icon,
  items,
}: {
  title: string;
  Icon: typeof AlertTriangle;
  items: unknown[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3 text-white/80">
        <Icon className="w-4 h-4 text-brand-2" />
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs text-white/40 ml-auto">{items.length}</span>
      </div>
      <ul className="space-y-3">
        {items.map((it, idx) => {
          const label = leakLabel(it);
          const fix = leakFix(it);
          const impact = leakImpact(it);
          if (!label) return null;
          return (
            <li key={idx} className="border-l-2 border-white/10 pl-3">
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-sm text-white/90">{label}</span>
                <ImpactBadge impact={impact} />
              </div>
              {fix && (
                <p className="text-xs text-white/55 mt-1">
                  <span className="text-emerald-300/80">Fix:</span> {fix}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function safeHost(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}

export function CROReportView({ analysis }: { analysis: CROAnalysis }) {
  const { report } = analysis;
  const host = safeHost(analysis.finalUrl || analysis.url);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/cro/${analysis.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-brand-2 mb-1 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> CRO leak analysis
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold break-all">
            {host}
          </h1>
          <a
            href={analysis.finalUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-brand-2 inline-flex items-center gap-1 mt-1 break-all"
          >
            {analysis.finalUrl} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={copyLink} className="btn btn-ghost text-sm">
            <Share2 className="w-4 h-4" />{" "}
            {copied ? "Copied" : "Share link"}
          </button>
        </div>
      </div>

      {/* Overall + summary */}
      <div className="card flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
        <ScoreRing value={report.overall_score} size={120} />
        <div className="flex-1">
          <div className="text-xs uppercase tracking-widest text-white/40 mb-1">
            Conversion effectiveness
          </div>
          <div className="text-2xl font-semibold mb-2">
            {report.overall_score}/100
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            {report.summary}
          </p>
        </div>
      </div>

      {/* Estimated revenue impact callout */}
      {report.estimated_revenue_impact && (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5 mb-6">
          <div className="flex items-center gap-2 mb-2 text-emerald-300">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-medium">
              Estimated revenue impact
            </span>
          </div>
          <p className="text-sm text-white/85 leading-relaxed">
            {report.estimated_revenue_impact}
          </p>
        </div>
      )}

      {/* Top leaks */}
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-300" /> Top leaks
      </h2>
      <div className="grid md:grid-cols-2 gap-3 mb-8">
        {report.top_leaks.map((leak, idx) => (
          <div key={idx} className="card">
            <div className="flex items-start gap-2 mb-2 flex-wrap">
              <h3 className="font-semibold text-white/90 flex-1">
                {leak.issue}
              </h3>
              <ImpactBadge impact={leak.impact} />
            </div>
            <div className="text-sm text-white/70 mb-2">
              <span className="text-white/40">Lost: </span>
              {leak.lost_opportunity}
            </div>
            <div className="text-sm text-emerald-200/85 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">
              <span className="text-emerald-300/80 font-medium">Fix:</span>{" "}
              {leak.fix}
            </div>
          </div>
        ))}
      </div>

      {/* Quick wins */}
      {report.quick_wins.length > 0 && (
        <div className="card mb-8">
          <div className="flex items-center gap-2 mb-3 text-white/80">
            <Rocket className="w-4 h-4 text-brand-2" />
            <h3 className="font-semibold">Quick wins (ship this week)</h3>
          </div>
          <ul className="space-y-2">
            {report.quick_wins.map((win, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-white/80"
              >
                <ChevronRight className="w-4 h-4 text-brand-2 mt-0.5 shrink-0" />
                {win}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Category leaks */}
      <div className="grid md:grid-cols-2 gap-3 mb-8">
        <CategorySection
          title="Conversion leaks"
          Icon={Target}
          items={report.conversion_leaks}
        />
        <CategorySection
          title="Trust leaks"
          Icon={ShieldCheck}
          items={report.trust_leaks}
        />
        <CategorySection title="SEO leaks" Icon={Search} items={report.seo_leaks} />
        <CategorySection
          title="Performance leaks"
          Icon={Zap}
          items={report.performance_leaks}
        />
      </div>

      {/* Premium add-ons */}
      {(report.ab_test_ideas.length > 0 ||
        report.positioning_improvements.length > 0 ||
        report.competitor_insights.length > 0) && (
        <div className="grid md:grid-cols-3 gap-3 mb-8">
          {report.ab_test_ideas.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3 text-white/80">
                <FlaskConical className="w-4 h-4 text-brand-2" />
                <h3 className="font-semibold">A/B test ideas</h3>
              </div>
              <ul className="space-y-2 text-sm text-white/75">
                {report.ab_test_ideas.map((t, idx) => (
                  <li key={idx} className="flex gap-2">
                    <ChevronRight className="w-4 h-4 text-brand-2 mt-0.5 shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.positioning_improvements.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3 text-white/80">
                <Megaphone className="w-4 h-4 text-brand-2" />
                <h3 className="font-semibold">Positioning</h3>
              </div>
              <ul className="space-y-2 text-sm text-white/75">
                {report.positioning_improvements.map((t, idx) => (
                  <li key={idx} className="flex gap-2">
                    <ChevronRight className="w-4 h-4 text-brand-2 mt-0.5 shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.competitor_insights.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3 text-white/80">
                <TrendingUp className="w-4 h-4 text-brand-2" />
                <h3 className="font-semibold">Competitor insights</h3>
              </div>
              <ul className="space-y-2 text-sm text-white/75">
                {report.competitor_insights.map((t, idx) => (
                  <li key={idx} className="flex gap-2">
                    <ChevronRight className="w-4 h-4 text-brand-2 mt-0.5 shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Final recommendation */}
      <div className="rounded-2xl border border-brand/40 bg-gradient-to-br from-brand/10 to-brand-2/10 p-6 mb-8">
        <div className="text-xs uppercase tracking-widest text-brand-2 mb-2 inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Final recommendation
        </div>
        <p className="text-base text-white/90 leading-relaxed">
          {report.final_recommendation}
        </p>
      </div>
    </div>
  );
}
