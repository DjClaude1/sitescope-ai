import { getAdminSupabase, isSupabaseConfigured } from "./supabase";
import type { AuditReport } from "./types";

// In-memory cache used when Supabase isn't configured, or as a fast path.
// NOTE: ephemeral per serverless instance; fine for free-tier demos.
const mem = new Map<string, { report: AuditReport; expires: number }>();
const MEM_TTL = 1000 * 60 * 60 * 24; // 24h

export async function saveAuditPublic(report: AuditReport): Promise<void> {
  mem.set(report.id, { report, expires: Date.now() + MEM_TTL });
  if (isSupabaseConfigured) {
    const sb = getAdminSupabase();
    if (!sb) return;
    try {
      await sb.from("audits").upsert({
        id: report.id,
        url: report.url,
        final_url: report.finalUrl,
        title: report.title,
        overall_score: report.overallScore,
        report: report,
        created_at: report.fetchedAt,
        is_public: true,
      });
    } catch (e) {
      console.error("[storage] supabase save failed", e);
    }
  }
}

export async function saveAuditForUser(
  report: AuditReport,
  userId: string
): Promise<void> {
  await saveAuditPublic(report);
  if (!isSupabaseConfigured) return;
  const sb = getAdminSupabase();
  if (!sb) return;
  try {
    await sb.from("audits").upsert({
      id: report.id,
      url: report.url,
      final_url: report.finalUrl,
      title: report.title,
      overall_score: report.overallScore,
      report: report,
      created_at: report.fetchedAt,
      is_public: true,
      user_id: userId,
    });
  } catch (e) {
    console.error("[storage] supabase save failed", e);
  }
}

export async function getAudit(id: string): Promise<AuditReport | null> {
  const entry = mem.get(id);
  if (entry && entry.expires > Date.now()) return entry.report;
  if (!isSupabaseConfigured) return null;
  const sb = getAdminSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb
      .from("audits")
      .select("report")
      .eq("id", id)
      .maybeSingle();
    if (data?.report) {
      mem.set(id, { report: data.report as AuditReport, expires: Date.now() + MEM_TTL });
      return data.report as AuditReport;
    }
  } catch (e) {
    console.error("[storage] supabase fetch failed", e);
  }
  return null;
}

export async function listUserAudits(
  userId: string,
  limit = 50
): Promise<AuditReport[]> {
  if (!isSupabaseConfigured) return [];
  const sb = getAdminSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from("audits")
    .select("report")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data || []).map((d) => d.report as AuditReport);
}

export interface UsageRow {
  user_id: string | null;
  ip: string;
  day: string;
  count: number;
  plan: "free" | "pro";
}

export async function getUsage(
  identifier: { userId?: string; ip: string }
): Promise<{ count: number; plan: "free" | "pro" }> {
  if (!isSupabaseConfigured) {
    // Fallback: in-memory rate limit is not meaningful across serverless instances;
    // treat as free/0 and enforce at UI with localStorage if desired.
    return { count: 0, plan: "free" };
  }
  const sb = getAdminSupabase();
  if (!sb) return { count: 0, plan: "free" };
  const day = new Date().toISOString().slice(0, 10);

  let plan: "free" | "pro" = "free";
  if (identifier.userId) {
    const { data: profile } = await sb
      .from("profiles")
      .select("plan")
      .eq("id", identifier.userId)
      .maybeSingle();
    if (profile?.plan === "pro") plan = "pro";
  }

  const query = sb.from("usage").select("count");
  const { data } = identifier.userId
    ? await query.eq("user_id", identifier.userId).eq("day", day).maybeSingle()
    : await query.eq("ip", identifier.ip).eq("day", day).maybeSingle();
  return { count: data?.count ?? 0, plan };
}

export async function incrementUsage(identifier: {
  userId?: string;
  ip: string;
}): Promise<void> {
  if (!isSupabaseConfigured) return;
  const sb = getAdminSupabase();
  if (!sb) return;
  const day = new Date().toISOString().slice(0, 10);
  const row = {
    user_id: identifier.userId ?? null,
    ip: identifier.ip,
    day,
    count: 1,
  };
  // naive upsert: try insert, fall back to rpc increment via a fetch pattern.
  const { data: existing } = await sb
    .from("usage")
    .select("id,count")
    .match(
      identifier.userId
        ? { user_id: identifier.userId, day }
        : { ip: identifier.ip, day, user_id: null }
    )
    .maybeSingle();
  if (existing) {
    await sb
      .from("usage")
      .update({ count: existing.count + 1 })
      .eq("id", existing.id);
  } else {
    await sb.from("usage").insert(row);
  }
}
