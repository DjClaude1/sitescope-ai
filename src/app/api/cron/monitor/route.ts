import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { runAudit } from "@/lib/audit";
import { saveAuditForUser } from "@/lib/storage";
import type { AuditReport } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Called by Vercel Cron weekly. Runs monitoring audits for Pro users
// and emails a summary via Resend if score drops.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ skipped: "supabase_not_configured" });
  }
  const sb = getAdminSupabase();
  if (!sb) return NextResponse.json({ error: "no_admin" }, { status: 500 });

  // Fetch monitors and resolve email/plan separately. The nested select
  // `profiles(...)` can return arrays or objects depending on the join
  // resolver; resolving per user explicitly is easier to type and also
  // lets us short-circuit when the user isn't Pro.
  const { data: monitors } = await sb
    .from("monitors")
    .select("id,user_id,url,last_score")
    .order("created_at", { ascending: true })
    .limit(500);

  const resendKey = process.env.RESEND_API_KEY;
  const resend = resendKey ? new Resend(resendKey) : null;
  const fromEmail = process.env.RESEND_FROM || "SiteScope <alerts@sitescope.ai>";
  const processed: Array<{ url: string; score: number; delta: number }> = [];

  // Cache profiles to avoid N queries for users with multiple monitors.
  const profileCache = new Map<string, { email: string | null; plan: string }>();
  async function loadProfile(userId: string) {
    const hit = profileCache.get(userId);
    if (hit) return hit;
    const { data } = await sb!
      .from("profiles")
      .select("email,plan")
      .eq("id", userId)
      .maybeSingle();
    const entry = {
      email: (data?.email as string | null) ?? null,
      plan: (data?.plan as string) ?? "free",
    };
    profileCache.set(userId, entry);
    return entry;
  }

  for (const m of monitors || []) {
    const profile = await loadProfile(m.user_id as string);
    if (profile.plan !== "pro") continue;
    try {
      const report = await runAudit(m.url);
      await saveAuditForUser(report as AuditReport, m.user_id);
      const prev = m.last_score ?? report.overallScore;
      const delta = report.overallScore - prev;
      await sb
        .from("monitors")
        .update({
          last_score: report.overallScore,
          last_audited_at: new Date().toISOString(),
        })
        .eq("id", m.id);

      // Only notify on a real change; first-ever audit (no previous
      // score) is silent so users aren't spammed when they first
      // subscribe to monitoring.
      const isFirstAudit = m.last_score === null || m.last_score === undefined;
      if (
        resend &&
        profile.email &&
        !isFirstAudit &&
        Math.abs(delta) >= 3
      ) {
        await resend.emails.send({
          from: fromEmail,
          to: profile.email,
          subject: `SiteScope: ${m.url} scored ${report.overallScore} (${delta >= 0 ? "+" : ""}${delta})`,
          html: weeklyEmail(report, delta),
        });
      }
      processed.push({ url: m.url, score: report.overallScore, delta });
    } catch (e) {
      console.error("[cron] monitor failed", m.url, e);
    }
  }

  return NextResponse.json({ ok: true, processed });
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function weeklyEmail(r: AuditReport, delta: number): string {
  const arrow = delta >= 0 ? "▲" : "▼";
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="margin:0 0 12px">Weekly site report</h1>
  <p style="color:#555">${esc(r.finalUrl)}</p>
  <div style="background:#0f0f1e;color:#fff;border-radius:12px;padding:20px;margin:16px 0">
    <div style="font-size:48px;font-weight:600">${r.overallScore}<span style="font-size:16px;color:#888"> /100 ${arrow} ${Math.abs(delta)}</span></div>
    <div style="color:#aaa">Overall score</div>
  </div>
  <p>${esc(r.aiSummary)}</p>
  <p><strong>Top issues</strong></p>
  <ul>${r.issues.slice(0, 5).map((i) => `<li>${esc(i.title)}</li>`).join("")}</ul>
  <p style="color:#777;font-size:12px">— SiteScope AI</p>
</div>`;
}
