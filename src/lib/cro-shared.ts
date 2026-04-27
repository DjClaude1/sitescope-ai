// Client-safe types and helpers for CRO analysis. Kept separate from
// `cro.ts` (which pulls in node:net via ssrf) so React Client Components
// can import these without poisoning the browser bundle.
import { z } from "zod";

export const ImpactEnum = z.enum(["low", "medium", "high"]);
export type Impact = z.infer<typeof ImpactEnum>;

export const TopLeakSchema = z.object({
  issue: z.string().min(1),
  impact: ImpactEnum,
  lost_opportunity: z.string().min(1),
  fix: z.string().min(1),
});
export type TopLeak = z.infer<typeof TopLeakSchema>;

const LeakItemRaw = z.union([
  z.string().min(1),
  z.object({
    issue: z.string().min(1),
    impact: ImpactEnum.optional(),
    fix: z.string().optional(),
  }),
]);

export const CROReportSchema = z.object({
  summary: z.string().min(1),
  overall_score: z.number().int().min(0).max(100),
  top_leaks: z.array(TopLeakSchema).min(1).max(8),
  conversion_leaks: z.array(LeakItemRaw).default([]),
  seo_leaks: z.array(LeakItemRaw).default([]),
  trust_leaks: z.array(LeakItemRaw).default([]),
  performance_leaks: z.array(LeakItemRaw).default([]),
  quick_wins: z.array(z.string().min(1)).default([]),
  estimated_revenue_impact: z.string().min(1),
  final_recommendation: z.string().min(1),
  ab_test_ideas: z.array(z.string().min(1)).default([]),
  positioning_improvements: z.array(z.string().min(1)).default([]),
  competitor_insights: z.array(z.string().min(1)).default([]),
});
export type CROReport = z.infer<typeof CROReportSchema>;

export interface CROAnalysis {
  id: string;
  url: string;
  finalUrl: string;
  fetchedAt: string;
  report: CROReport;
}

export function leakLabel(item: unknown): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object" && "issue" in item) {
    const obj = item as { issue?: unknown };
    if (typeof obj.issue === "string") return obj.issue;
  }
  return "";
}

export function leakFix(item: unknown): string {
  if (item && typeof item === "object" && "fix" in item) {
    const obj = item as { fix?: unknown };
    if (typeof obj.fix === "string") return obj.fix;
  }
  return "";
}

export function leakImpact(item: unknown): Impact | null {
  if (item && typeof item === "object" && "impact" in item) {
    const obj = item as { impact?: unknown };
    if (
      obj.impact === "low" ||
      obj.impact === "medium" ||
      obj.impact === "high"
    ) {
      return obj.impact;
    }
  }
  return null;
}
