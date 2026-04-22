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
  // Cache locally and do a SINGLE upsert that includes user_id. Previously
  // this called saveAuditPublic first (which wrote the row with no user_id)
  // and could leave the audit orphaned if the second write failed.
  mem.set(report.id, { report, expires: Date.now() + MEM_TTL });
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

export interface PublicAuditSummary {
  id: string;
  url: string;
  finalUrl: string;
  title: string | null;
  overallScore: number;
  createdAt: string;
}

// Lightweight summaries for homepage / leaderboard — we select only the
// columns we need to avoid shipping entire JSON reports across the wire.
export async function listRecentPublicAudits(
  limit = 12,
): Promise<PublicAuditSummary[]> {
  if (!isSupabaseConfigured) return [];
  const sb = getAdminSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from("audits")
    .select("id, url, final_url, title, overall_score, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data || []).map((r) => ({
    id: r.id as string,
    url: r.url as string,
    finalUrl: (r.final_url as string) ?? (r.url as string),
    title: (r.title as string | null) ?? null,
    overallScore: (r.overall_score as number) ?? 0,
    createdAt: r.created_at as string,
  }));
}

export async function listTopPublicAudits(
  limit = 20,
  days = 7,
): Promise<PublicAuditSummary[]> {
  if (!isSupabaseConfigured) return [];
  const sb = getAdminSupabase();
  if (!sb) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await sb
    .from("audits")
    .select("id, url, final_url, title, overall_score, created_at")
    .eq("is_public", true)
    .gte("created_at", since)
    .order("overall_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data || []).map((r) => ({
    id: r.id as string,
    url: r.url as string,
    finalUrl: (r.final_url as string) ?? (r.url as string),
    title: (r.title as string | null) ?? null,
    overallScore: (r.overall_score as number) ?? 0,
    createdAt: r.created_at as string,
  }));
}

export async function countAudits(): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const sb = getAdminSupabase();
  if (!sb) return 0;
  const { count } = await sb
    .from("audits")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
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

  // Atomic increment via Postgres function defined in supabase/schema.sql.
  // This is race-safe: concurrent calls each produce a distinct +1 increment.
  const { error } = await sb.rpc("increment_usage", {
    p_user_id: identifier.userId ?? null,
    p_ip: identifier.ip,
    p_day: day,
  });
  if (error) {
    console.error("[storage] increment_usage rpc failed", error);
  }
}

// Atomic check-and-increment for free-tier rate limiting. Prevents TOCTOU
// between the limit check and the counter increment.
//
// Returns `allowed=true` only if the call succeeded AND the post-increment
// count is <= limit. When Supabase isn't configured we fall through to
// "allowed" (the app is effectively single-tenant/demo in that mode).
export async function reserveAudit(
  identifier: { userId?: string; ip: string },
  limit: number
): Promise<{ allowed: boolean; count: number }> {
  if (!isSupabaseConfigured) return { allowed: true, count: 0 };
  const sb = getAdminSupabase();
  if (!sb) return { allowed: true, count: 0 };
  const day = new Date().toISOString().slice(0, 10);

  const { data, error } = await sb.rpc("reserve_audit", {
    p_user_id: identifier.userId ?? null,
    p_ip: identifier.ip,
    p_day: day,
    p_limit: limit,
  });
  if (error) {
    console.error("[storage] reserve_audit rpc failed", error);
    // Fail closed: deny the audit rather than risk unbounded bypass.
    return { allowed: false, count: limit };
  }
  const row = Array.isArray(data) ? data[0] : data;
  const allowed = Boolean(row?.allowed);
  const count = typeof row?.new_count === "number" ? row.new_count : 0;
  return { allowed, count };
}

// Refund a reserved slot when the downstream audit fails. No-op on error.
export async function refundUsage(identifier: {
  userId?: string;
  ip: string;
}): Promise<void> {
  if (!isSupabaseConfigured) return;
  const sb = getAdminSupabase();
  if (!sb) return;
  const day = new Date().toISOString().slice(0, 10);
  const { error } = await sb.rpc("refund_usage", {
    p_user_id: identifier.userId ?? null,
    p_ip: identifier.ip,
    p_day: day,
  });
  if (error) console.error("[storage] refund_usage rpc failed", error);
}
