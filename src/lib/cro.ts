import { randomUUID } from "node:crypto";
import { geminiJSON, isGeminiConfigured } from "./gemini";
import { scrape } from "./scrape";
import { assertPublicUrl } from "./ssrf";
import {
  CROReportSchema,
  type CROAnalysis,
} from "./cro-shared";

// ============================================================================
// CRO Leak Analysis — server-side runner. Calls the scraper, builds the
// "senior CRO consultant" prompt, hands it to Gemini in JSON mode, validates
// the response with the shared zod schema, and returns a stored-shaped
// CROAnalysis.
// ============================================================================

export type {
  CROReport,
  CROAnalysis,
  TopLeak,
  Impact,
} from "./cro-shared";
export {
  CROReportSchema,
  TopLeakSchema,
  ImpactEnum,
  leakLabel,
  leakFix,
  leakImpact,
} from "./cro-shared";

const PROMPT = `You are a senior conversion rate optimization (CRO) expert, UX strategist, and digital marketing consultant.

Your task is to analyze a website and identify what is causing it to lose traffic, leads, and revenue.

----------------------------------------
INPUT:
Website URL: {{url}}
Extracted Content: {{page_content}}
----------------------------------------

OBJECTIVE:
Identify and explain the most important "leaks" in the website that reduce conversions and performance. Focus on real business impact, not just technical issues.

----------------------------------------
OUTPUT FORMAT (STRICT JSON ONLY — no prose, no markdown fences):
{
  "summary": "string — what's wrong overall, in 2–3 sentences focused on missed opportunities",
  "overall_score": 0,
  "top_leaks": [
    {
      "issue": "string",
      "impact": "low | medium | high",
      "lost_opportunity": "string — what's being lost (leads / trust / sales)",
      "fix": "string — the concrete fix"
    }
  ],
  "conversion_leaks": [
    { "issue": "string", "impact": "low|medium|high", "fix": "string" }
  ],
  "seo_leaks": [
    { "issue": "string", "impact": "low|medium|high", "fix": "string" }
  ],
  "trust_leaks": [
    { "issue": "string", "impact": "low|medium|high", "fix": "string" }
  ],
  "performance_leaks": [
    { "issue": "string", "impact": "low|medium|high", "fix": "string" }
  ],
  "quick_wins": ["string — easy fix that can ship today"],
  "estimated_revenue_impact": "string — realistic, business-focused estimate of upside",
  "final_recommendation": "string — clear next step",
  "ab_test_ideas": ["string — specific test (control vs variant) tied to a leak"],
  "positioning_improvements": ["string — sharper messaging / value-prop angle"],
  "competitor_insights": ["string — what stronger competitors do that this site doesn't"]
}

----------------------------------------
INSTRUCTIONS:
1. SUMMARY — brief explanation of what's wrong overall, focused on missed opportunities, not jargon.
2. OVERALL SCORE — 0–100 based on conversion effectiveness (not technical perfection).
3. TOP LEAKS — the 3–5 most critical issues. For each: what's wrong, why it matters, what is being lost (leads, trust, sales), how to fix.
4. CONVERSION LEAKS — missing CTAs, poor layout, confusing messaging, weak value proposition.
5. SEO LEAKS — missing keywords, poor structure, lack of optimization (but tie to traffic→revenue).
6. TRUST LEAKS — no testimonials, weak branding, lack of credibility signals (logos, security, reviews).
7. PERFORMANCE LEAKS — slow load, heavy assets, poor mobile experience.
8. QUICK WINS — easy fixes that improve results in <1 week.
9. ESTIMATED REVENUE IMPACT — realistic, business-focused language, NOT "10x your revenue".
10. FINAL RECOMMENDATION — clear, single next step.

PREMIUM MODE (always on):
- Prioritize high-impact revenue leaks over nitpicks.
- Provide advanced CRO insights, not generic checklist items.
- Suggest 2–4 A/B test ideas tied to specific leaks (control vs. variant, what to measure).
- Include positioning and messaging improvements.
- Add competitor-style insights where possible (what category leaders do better).

GLOBAL RULES:
- Be direct and practical. Avoid generic statements.
- Focus on business impact, not technical purity.
- Use clear, simple language. No marketing fluff.
- Read like expert consulting advice, not a checklist.
- Output ONLY the JSON object. No explanations outside JSON.`;

const MAX_CONTENT_CHARS = 18_000;

function buildPrompt(url: string, pageContent: string): string {
  const trimmed = pageContent
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CONTENT_CHARS);
  return PROMPT
    .replace("{{url}}", url)
    .replace("{{page_content}}", trimmed || "(no extractable text)");
}

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!u) throw new Error("URL required");
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  const parsed = new URL(u);
  if (!parsed.hostname.includes(".")) throw new Error("Invalid URL");
  return parsed.toString();
}

export async function runCROAnalysis(inputUrl: string): Promise<CROAnalysis> {
  if (!isGeminiConfigured) {
    throw new Error("CRO analysis requires GEMINI_API_KEY");
  }
  const normalized = normalizeUrl(inputUrl);
  await assertPublicUrl(normalized);
  const scraped = await scrape(normalized);

  const prompt = buildPrompt(scraped.finalUrl, scraped.visibleText);
  const raw = await geminiJSON<unknown>(prompt);

  const parsed = CROReportSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      "Gemini returned an invalid CRO report shape: " +
        parsed.error.issues
          .map((i) => i.path.join(".") + " " + i.message)
          .join("; ")
    );
  }

  return {
    id: randomUUID(),
    url: normalized,
    finalUrl: scraped.finalUrl,
    fetchedAt: new Date().toISOString(),
    report: parsed.data,
  };
}
