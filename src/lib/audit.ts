import { randomUUID } from "node:crypto";
import { geminiJSON, isGeminiConfigured } from "./gemini";
import { scrape } from "./scrape";
import type {
  AuditCategoryKey,
  AuditIssue,
  AuditReport,
  CategoryScore,
  PageSignals,
} from "./types";

export async function runAudit(inputUrl: string): Promise<AuditReport> {
  const normalized = normalizeUrl(inputUrl);
  const scraped = await scrape(normalized);
  const signals: PageSignals = {
    ...scraped.signals,
    statusCode: scraped.statusCode,
    loadTimeMs: scraped.loadTimeMs,
  };

  const heuristics = heuristicIssues(signals, scraped.finalUrl);
  let ai: AIResponse | null = null;
  if (isGeminiConfigured) {
    try {
      ai = await aiAudit(scraped.finalUrl, signals, scraped.visibleText);
    } catch (e) {
      console.error("[ai-audit] failed", e);
    }
  }

  const issues = mergeIssues(heuristics, ai?.issues || []);
  const scores = computeScores(signals, issues, ai?.scores);
  const overall = Math.round(
    scores.reduce((acc, s) => acc + s.score, 0) / scores.length
  );
  const quickWins =
    ai?.quickWins && ai.quickWins.length > 0
      ? ai.quickWins
      : deriveQuickWins(issues);

  const report: AuditReport = {
    id: randomUUID(),
    url: normalized,
    finalUrl: scraped.finalUrl,
    title: signals.metaTitle || "(no title)",
    description: signals.metaDescription || "",
    fetchedAt: new Date().toISOString(),
    overallScore: overall,
    scores,
    issues,
    quickWins: quickWins.slice(0, 6),
    aiSummary: ai?.summary || heuristicSummary(signals, overall),
    signals,
  };
  return report;
}

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!u) throw new Error("URL required");
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const parsed = new URL(u);
    if (!parsed.hostname.includes(".")) throw new Error("invalid host");
    return parsed.toString();
  } catch {
    throw new Error("Invalid URL");
  }
}

function heuristicIssues(s: PageSignals, url: string): AuditIssue[] {
  const out: AuditIssue[] = [];
  const push = (i: Omit<AuditIssue, "id">) =>
    out.push({ id: randomUUID(), ...i });

  // SEO
  if (!s.metaTitle) {
    push({
      title: "Missing <title> tag",
      description: "The page has no title. Search engines need this to rank your page.",
      severity: "critical",
      impact: "High — every search result depends on title.",
      recommendation: "Add a unique, keyword-rich <title> between 50–60 characters.",
      category: "seo",
    });
  } else if (s.metaTitle.length < 30 || s.metaTitle.length > 65) {
    push({
      title: `Title tag length is ${s.metaTitle.length} chars`,
      description: `Ideal length is 50–60 characters. Current title: "${s.metaTitle}".`,
      severity: "warning",
      impact: "Medium — titles outside this range get truncated in SERPs.",
      recommendation: "Rewrite the title to 50–60 chars with primary keyword near the start.",
      category: "seo",
    });
  }
  if (!s.metaDescription) {
    push({
      title: "Missing meta description",
      description: "No meta description found. This is your search snippet sales pitch.",
      severity: "critical",
      impact: "High — hurts click-through rate from search results.",
      recommendation: "Write a 150–160 char description with primary keyword and a benefit.",
      category: "seo",
    });
  } else if (s.metaDescription.length < 80 || s.metaDescription.length > 170) {
    push({
      title: `Meta description length is ${s.metaDescription.length} chars`,
      description: "Optimal range is 150–160 characters.",
      severity: "warning",
      impact: "Medium — off-length descriptions get truncated or look empty.",
      recommendation: "Rewrite to 150–160 characters with a clear benefit and CTA.",
      category: "seo",
    });
  }
  if (!s.hasH1) {
    push({
      title: "No H1 heading found",
      description: "Every page should have exactly one clear H1.",
      severity: "critical",
      impact: "High — H1 signals the page's main topic to Google.",
      recommendation: "Add one descriptive H1 that matches the page's search intent.",
      category: "seo",
    });
  }
  if (!s.canonical) {
    push({
      title: "No canonical URL set",
      description: "Canonical tag prevents duplicate content penalties.",
      severity: "warning",
      impact: "Medium — can fragment ranking signals across URL variations.",
      recommendation: `Add <link rel="canonical" href="${url}" /> to <head>.`,
      category: "seo",
    });
  }
  if (!s.hasSchemaOrg) {
    push({
      title: "No structured data (schema.org)",
      description: "Structured data unlocks rich results in Google.",
      severity: "warning",
      impact: "Medium — competitors with schema win richer SERP real estate.",
      recommendation:
        "Add JSON-LD for Organization/Product/Article/FAQ depending on page type.",
      category: "seo",
    });
  }
  if (!s.hasOpenGraph) {
    push({
      title: "Missing Open Graph tags",
      description: "OG tags control how the page looks when shared on Facebook/LinkedIn.",
      severity: "warning",
      impact: "Medium — ugly social shares = fewer clicks.",
      recommendation: "Add og:title, og:description, og:image, og:url.",
      category: "seo",
    });
  }
  if (!s.hasTwitterCard) {
    push({
      title: "Missing Twitter Card tags",
      description: "Twitter/X needs its own meta to render previews.",
      severity: "info",
      impact: "Low — but easy to fix.",
      recommendation: "Add twitter:card, twitter:title, twitter:description, twitter:image.",
      category: "seo",
    });
  }

  // Performance
  if (s.htmlSize > 500_000) {
    push({
      title: `HTML size is ${(s.htmlSize / 1024).toFixed(0)} KB`,
      description: "Pages over 500KB HTML often indicate bloated markup.",
      severity: "warning",
      impact: "Medium — slows first paint, hurts Core Web Vitals.",
      recommendation: "Defer non-critical JS, inline only critical CSS, lazy-load below-the-fold.",
      category: "performance",
    });
  }
  if (s.scriptsCount > 25) {
    push({
      title: `${s.scriptsCount} script tags on page`,
      description: "Too many scripts block rendering and bloat the JS bundle.",
      severity: "warning",
      impact: "Medium — each third-party script adds latency and privacy risk.",
      recommendation: "Audit third-party scripts, remove unused, defer the rest.",
      category: "performance",
    });
  }
  if (s.stylesheetsCount > 8) {
    push({
      title: `${s.stylesheetsCount} external stylesheets`,
      description: "Each stylesheet is a render-blocking request.",
      severity: "info",
      impact: "Low/Medium — consolidate and preload critical CSS.",
      recommendation: "Combine stylesheets, inline critical CSS, load the rest async.",
      category: "performance",
    });
  }
  if (s.loadTimeMs > 3000) {
    push({
      title: `Initial HTML took ${(s.loadTimeMs / 1000).toFixed(1)}s to download`,
      description: "TTFB directly impacts every other Core Web Vital.",
      severity: "warning",
      impact: "High — >3s TTFB is in Google's 'poor' bucket.",
      recommendation: "Use a CDN, enable caching, upgrade server, pre-render static pages.",
      category: "performance",
    });
  }

  // Accessibility
  if (s.imagesMissingAlt > 0 && s.imagesTotal > 0) {
    const pct = Math.round((s.imagesMissingAlt / s.imagesTotal) * 100);
    push({
      title: `${s.imagesMissingAlt} images missing alt text (${pct}%)`,
      description: "Screen readers skip images without alt text.",
      severity: s.imagesMissingAlt > 5 ? "critical" : "warning",
      impact: "High — blocks visually impaired users and hurts image SEO.",
      recommendation: "Add descriptive alt text to every meaningful image; alt=\"\" for decorative.",
      category: "accessibility",
    });
  }
  if (!s.hasLangAttr) {
    push({
      title: "Missing lang attribute on <html>",
      description: "Browsers and screen readers need to know the page language.",
      severity: "warning",
      impact: "Medium — hurts accessibility and internationalization.",
      recommendation: 'Add lang="en" (or appropriate) to <html>.',
      category: "accessibility",
    });
  }
  if (!s.viewport) {
    push({
      title: "No mobile viewport meta tag",
      description: "Without viewport, mobile devices render desktop layout zoomed out.",
      severity: "critical",
      impact: "High — Google penalizes non-mobile-friendly pages.",
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1" />.',
      category: "accessibility",
    });
  }

  // Conversion
  if (s.formsCount === 0 && s.ctaButtons.length < 2) {
    push({
      title: "Weak call-to-action presence",
      description: "No forms and very few CTA buttons found.",
      severity: "warning",
      impact: "High — conversions require obvious next actions.",
      recommendation: "Add a prominent above-the-fold CTA and secondary CTAs throughout.",
      category: "conversion",
    });
  }
  if (s.emails.length === 0 && s.phoneNumbers.length === 0 && s.socialLinks.length === 0) {
    push({
      title: "No contact or social channels visible",
      description: "Users look for trust signals like email, phone, social links.",
      severity: "warning",
      impact: "Medium — reduces trust for new visitors.",
      recommendation: "Add contact info and verified social links in the footer.",
      category: "conversion",
    });
  }
  if (!s.hasGoogleAnalytics && !s.hasMetaPixel) {
    push({
      title: "No analytics or conversion tracking detected",
      description: "Neither GA/GTM nor Meta Pixel was found.",
      severity: "warning",
      impact: "High — you can't optimize what you can't measure.",
      recommendation: "Install Google Analytics 4 (via GTM) and relevant ad pixels.",
      category: "conversion",
    });
  }

  // Content
  if (s.wordCount < 300) {
    push({
      title: `Only ${s.wordCount} words of content`,
      description: "Thin pages rank poorly and convert poorly.",
      severity: s.wordCount < 100 ? "critical" : "warning",
      impact: "High — Google's quality guidelines favor depth.",
      recommendation: "Expand to 800+ words of useful, on-topic content.",
      category: "content",
    });
  }

  return out;
}

type AIResponse = {
  summary: string;
  issues: Array<Omit<AuditIssue, "id"> & { id?: string }>;
  quickWins: string[];
  scores?: Partial<Record<AuditCategoryKey, number>>;
};

async function aiAudit(
  url: string,
  s: PageSignals,
  visibleText: string
): Promise<AIResponse> {
  const prompt = `You are an elite website audit consultant (SEO + CRO + accessibility + content).
Analyze the following page and return STRICT JSON in this schema:
{
  "summary": "2-3 sentence executive summary of the site's biggest opportunities",
  "scores": {
    "seo": 0-100, "performance": 0-100, "accessibility": 0-100, "conversion": 0-100, "content": 0-100
  },
  "issues": [
    { "title": "...", "description": "...", "severity": "critical|warning|info",
      "impact": "...", "recommendation": "...", "category": "seo|performance|accessibility|conversion|content" }
  ],
  "quickWins": ["short actionable bullet", "..."]
}

Rules:
- Be specific and use signals below. Reference actual text/CTAs you see.
- 4-8 issues focused on the HIGHEST-VALUE opportunities the user would pay for.
- "quickWins" are 3-5 things the owner can do in under 1 hour today.
- No markdown, no code fences. JSON only.

URL: ${url}
Signals: ${JSON.stringify(
    {
      title: s.metaTitle,
      description: s.metaDescription,
      h1: s.headings.filter((h) => h.level === 1).map((h) => h.text),
      h2: s.headings.filter((h) => h.level === 2).map((h) => h.text).slice(0, 10),
      wordCount: s.wordCount,
      hasHttps: s.hasHttps,
      hasSchemaOrg: s.hasSchemaOrg,
      hasOpenGraph: s.hasOpenGraph,
      hasGoogleAnalytics: s.hasGoogleAnalytics,
      hasMetaPixel: s.hasMetaPixel,
      imagesTotal: s.imagesTotal,
      imagesMissingAlt: s.imagesMissingAlt,
      ctaButtons: s.ctaButtons,
      linksInternal: s.linksInternal,
      linksExternal: s.linksExternal,
      loadTimeMs: s.loadTimeMs,
      htmlSize: s.htmlSize,
    },
    null,
    0
  )}

Visible text sample (first 4000 chars):
${visibleText.slice(0, 4000)}`;

  return geminiJSON<AIResponse>(prompt);
}

function mergeIssues(
  heuristic: AuditIssue[],
  ai: AIResponse["issues"]
): AuditIssue[] {
  const out = [...heuristic];
  for (const i of ai || []) {
    if (!i.title || !i.category) continue;
    const dup = out.find(
      (h) =>
        h.category === i.category &&
        h.title.toLowerCase().slice(0, 20) ===
          i.title.toLowerCase().slice(0, 20)
    );
    if (dup) continue;
    out.push({
      id: randomUUID(),
      title: i.title,
      description: i.description || "",
      severity: (i.severity as AuditIssue["severity"]) || "info",
      impact: i.impact || "",
      recommendation: i.recommendation || "",
      category: i.category,
    });
  }
  return out.sort((a, b) => sevRank(b.severity) - sevRank(a.severity));
}

function sevRank(sev: AuditIssue["severity"]): number {
  return sev === "critical" ? 3 : sev === "warning" ? 2 : 1;
}

function computeScores(
  _s: PageSignals,
  issues: AuditIssue[],
  aiScores?: Partial<Record<AuditCategoryKey, number>>
): CategoryScore[] {
  const cats: AuditCategoryKey[] = [
    "seo",
    "performance",
    "accessibility",
    "conversion",
    "content",
  ];
  return cats.map((c) => {
    const penalty = issues
      .filter((i) => i.category === c)
      .reduce(
        (acc, i) =>
          acc +
          (i.severity === "critical"
            ? 22
            : i.severity === "warning"
              ? 10
              : 3),
        0
      );
    const heuristicScore = Math.max(10, 100 - penalty);
    const ai = aiScores?.[c];
    const final =
      typeof ai === "number"
        ? Math.round((heuristicScore + clamp(ai, 0, 100)) / 2)
        : heuristicScore;
    return {
      category: c,
      score: final,
      summary: summarizeCategory(c, final),
    };
  });
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function summarizeCategory(
  c: AuditCategoryKey,
  score: number
): string {
  const label =
    score >= 85
      ? "Excellent"
      : score >= 70
        ? "Good"
        : score >= 50
          ? "Needs work"
          : "Critical";
  const map: Record<AuditCategoryKey, string> = {
    seo: "Search engine visibility and discoverability",
    performance: "Page weight, render-blocking assets, and load speed",
    accessibility: "Usability for all visitors including assistive tech",
    conversion: "Trust, clarity, and paths to conversion",
    content: "Depth, relevance, and readability of on-page content",
  };
  return `${label} — ${map[c]}.`;
}

function deriveQuickWins(issues: AuditIssue[]): string[] {
  return issues
    .filter((i) => i.severity !== "info")
    .slice(0, 5)
    .map((i) => i.recommendation);
}

function heuristicSummary(s: PageSignals, overall: number): string {
  const name = s.metaTitle || "This page";
  return `${name} scores ${overall}/100 overall. Biggest opportunities: ${
    !s.metaDescription ? "add a meta description, " : ""
  }${!s.hasSchemaOrg ? "add structured data, " : ""}${
    s.imagesMissingAlt > 0 ? "fix image alt text, " : ""
  }${!s.hasGoogleAnalytics ? "install analytics, " : ""}tighten the value proposition above the fold.`;
}
