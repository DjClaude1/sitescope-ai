import { NextResponse } from "next/server";
import { z } from "zod";
import { runAudit } from "@/lib/audit";
import { saveAuditPublic, saveAuditForUser, getUsage, incrementUsage } from "@/lib/storage";
import { canAudit, FREE_DAILY_LIMIT } from "@/lib/plan";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  url: z.string().min(3).max(2048),
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const ip = getClientIp(req);
  const userId = await resolveUserId(req);
  const { count, plan } = await getUsage({ userId, ip });
  const gate = canAudit(plan, count);
  if (!gate.allowed) {
    return NextResponse.json(
      {
        error: "Daily free limit reached",
        code: "LIMIT_REACHED",
        limit: FREE_DAILY_LIMIT,
        plan,
      },
      { status: 402 }
    );
  }

  try {
    const report = await runAudit(parsed.data.url);
    if (userId) await saveAuditForUser(report, userId);
    else await saveAuditPublic(report);
    await incrementUsage({ userId, ip });
    return NextResponse.json({
      report,
      remaining: plan === "pro" ? null : Math.max(0, gate.remaining - 1),
      plan,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Audit failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function getClientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "0.0.0.0"
  );
}

async function resolveUserId(req: Request): Promise<string | undefined> {
  if (!isSupabaseConfigured) return undefined;
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return undefined;
  const token = auth.slice("Bearer ".length);
  const sb = getAdminSupabase();
  if (!sb) return undefined;
  const { data } = await sb.auth.getUser(token);
  return data.user?.id;
}
