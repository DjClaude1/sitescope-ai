import { getAdminSupabase, isSupabaseConfigured } from "./supabase";
import type { CROAnalysis } from "./cro-shared";

// In-memory cache for CRO analyses — same pattern as the audit cache.
// Per serverless instance; primary store is Supabase.
const mem = new Map<string, { analysis: CROAnalysis; expires: number }>();
const MEM_TTL = 1000 * 60 * 60 * 24; // 24h

interface CROAnalysisRow {
  id: string;
  user_id: string | null;
  url: string;
  final_url: string | null;
  overall_score: number | null;
  report: unknown;
  is_public: boolean;
  created_at: string;
}

function rowToAnalysis(row: CROAnalysisRow): CROAnalysis {
  return {
    id: row.id,
    url: row.url,
    finalUrl: row.final_url ?? row.url,
    fetchedAt: row.created_at,
    report: row.report as CROAnalysis["report"],
  };
}

export async function saveCROAnalysis(
  analysis: CROAnalysis,
  userId?: string
): Promise<void> {
  mem.set(analysis.id, { analysis, expires: Date.now() + MEM_TTL });
  if (!isSupabaseConfigured) return;
  const sb = getAdminSupabase();
  if (!sb) return;
  try {
    await sb.from("cro_analyses").upsert({
      id: analysis.id,
      user_id: userId ?? null,
      url: analysis.url,
      final_url: analysis.finalUrl,
      overall_score: analysis.report.overall_score,
      report: analysis.report,
      is_public: true,
      created_at: analysis.fetchedAt,
    });
  } catch (e) {
    console.error("[cro-storage] save failed", e);
  }
}

export async function getCROAnalysis(id: string): Promise<CROAnalysis | null> {
  const entry = mem.get(id);
  if (entry && entry.expires > Date.now()) return entry.analysis;
  if (!isSupabaseConfigured) return null;
  const sb = getAdminSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb
      .from("cro_analyses")
      .select("id,user_id,url,final_url,overall_score,report,is_public,created_at")
      .eq("id", id)
      .maybeSingle();
    if (!data) return null;
    const analysis = rowToAnalysis(data as CROAnalysisRow);
    mem.set(id, { analysis, expires: Date.now() + MEM_TTL });
    return analysis;
  } catch (e) {
    console.error("[cro-storage] fetch failed", e);
    return null;
  }
}
