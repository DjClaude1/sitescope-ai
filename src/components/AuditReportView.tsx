"use client";
import { useRef } from "react";
import { toast } from "sonner";
import {
  Copy,
  Download,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  Share2,
} from "lucide-react";
import { ScoreRing } from "./ScoreRing";
import type { AuditCategoryKey, AuditIssue, AuditReport } from "@/lib/types";

const CATEGORY_LABEL: Record<string, string> = {
  seo: "SEO",
  performance: "Performance",
  accessibility: "Accessibility",
  conversion: "Conversion",
  content: "Content",
};

export function AuditReportView({ report }: { report: AuditReport }) {
  const ref = useRef<HTMLDivElement>(null);

  async function exportPdf() {
    toast.loading("Building PDF…", { id: "pdf" });
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const node = ref.current;
      if (!node) return;
      const canvas = await html2canvas(node, {
        backgroundColor: "#07071a",
        scale: 2,
        windowWidth: 1200,
      });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / pageW;
      const imgH = canvas.height / ratio;
      let y = 0;
      while (y < imgH) {
        pdf.addImage(img, "PNG", 0, -y, pageW, imgH);
        y += pageH;
        if (y < imgH) pdf.addPage();
      }
      pdf.save(`sitescope-${report.finalUrl.replace(/[^a-z0-9]/gi, "_")}.pdf`);
      toast.success("Report downloaded", { id: "pdf" });
    } catch (e: unknown) {
      console.error(e);
      toast.error("PDF export failed", { id: "pdf" });
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}/audit/${report.id}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  const groupedIssues = groupBy(report.issues, (i) => i.category);
  const orderedCategories = (Object.keys(groupedIssues) as AuditCategoryKey[]);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-white/40 mb-1">
            Audit report
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold break-all">
            {report.title || report.finalUrl}
          </h1>
          <a
            href={report.finalUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-brand-2 inline-flex items-center gap-1 mt-1 break-all"
          >
            {report.finalUrl} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={copyLink} className="btn btn-ghost text-sm">
            <Share2 className="w-4 h-4" /> Share link
          </button>
          <button onClick={exportPdf} className="btn btn-primary text-sm">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div ref={ref} className="space-y-6">
        {/* Overall */}
        <div className="card flex flex-col md:flex-row items-start md:items-center gap-6">
          <ScoreRing value={report.overallScore} size={120} />
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-white/40 mb-1">
              Overall score
            </div>
            <p className="text-white/80 leading-relaxed">{report.aiSummary}</p>
            <div className="text-xs text-white/40 mt-2">
              Audited {new Date(report.fetchedAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Category scores */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {report.scores.map((s) => (
            <div
              key={s.category}
              className="card flex flex-col items-center text-center py-5"
            >
              <ScoreRing value={s.score} size={72} />
              <div className="mt-3 text-sm font-medium">
                {CATEGORY_LABEL[s.category]}
              </div>
            </div>
          ))}
        </div>

        {/* Quick wins */}
        {report.quickWins.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-4 h-4 text-emerald-400" />
              <div className="font-medium">Quick wins (do these first)</div>
            </div>
            <ul className="space-y-2 text-sm">
              {report.quickWins.map((qw, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-white/80"
                >
                  <span className="mt-1 w-5 h-5 rounded bg-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span>{qw}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Issues by category */}
        {orderedCategories.map((cat) => {
          const items = groupedIssues[cat] || [];
          return (
            <div key={cat} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="font-medium">
                  {CATEGORY_LABEL[cat]} ·{" "}
                  <span className="text-white/40">
                    {items.length} issue{items.length === 1 ? "" : "s"}
                  </span>
                </div>
                <ScoreRing
                  value={
                    report.scores.find((s) => s.category === cat)?.score ?? 0
                  }
                  size={44}
                />
              </div>
              <div className="space-y-3">
                {items.map((issue: AuditIssue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Signals footer */}
        <div className="card">
          <div className="text-xs uppercase tracking-widest text-white/40 mb-3">
            Raw signals
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Status" value={report.signals.statusCode.toString()} />
            <Stat
              label="HTML size"
              value={`${(report.signals.htmlSize / 1024).toFixed(0)} KB`}
            />
            <Stat
              label="Load time"
              value={`${(report.signals.loadTimeMs / 1000).toFixed(1)}s`}
            />
            <Stat
              label="Word count"
              value={report.signals.wordCount.toLocaleString()}
            />
            <Stat
              label="Images"
              value={`${report.signals.imagesTotal} (${report.signals.imagesMissingAlt} no alt)`}
            />
            <Stat
              label="Internal links"
              value={report.signals.linksInternal.toString()}
            />
            <Stat
              label="External links"
              value={report.signals.linksExternal.toString()}
            />
            <Stat
              label="Scripts"
              value={report.signals.scriptsCount.toString()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function IssueCard({ issue }: { issue: AuditIssue }) {
  const sev =
    issue.severity === "critical"
      ? { icon: <AlertCircle className="w-4 h-4" />, cls: "text-rose-400 bg-rose-500/10 border-rose-500/20" }
      : issue.severity === "warning"
        ? { icon: <AlertTriangle className="w-4 h-4" />, cls: "text-amber-300 bg-amber-500/10 border-amber-500/20" }
        : { icon: <Info className="w-4 h-4" />, cls: "text-sky-300 bg-sky-500/10 border-sky-500/20" };

  async function copyRec() {
    await navigator.clipboard.writeText(issue.recommendation);
    toast.success("Copied recommendation");
  }

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${sev.cls}`}
          >
            {sev.icon} {issue.severity}
          </span>
          <div>
            <div className="font-medium">{issue.title}</div>
            <div className="text-sm text-white/60 mt-0.5">
              {issue.description}
            </div>
          </div>
        </div>
        <button
          onClick={copyRec}
          className="text-white/40 hover:text-white transition shrink-0"
          title="Copy recommendation"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
        {issue.impact && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">
              Impact
            </div>
            <div className="text-white/80">{issue.impact}</div>
          </div>
        )}
        {issue.recommendation && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">
              Recommendation
            </div>
            <div className="text-white/80">{issue.recommendation}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
      <div className="text-[11px] uppercase tracking-wider text-white/40">
        {label}
      </div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function groupBy<T, K extends string>(
  arr: T[],
  key: (t: T) => K
): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of arr) {
    const k = key(item);
    if (!out[k]) out[k] = [];
    out[k].push(item);
  }
  return out;
}
