import { NextResponse } from "next/server";
import { z } from "zod";
import { runCROAnalysis } from "@/lib/cro";
import { saveCROAnalysis } from "@/lib/cro-storage";
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

  // CRO is a "premium consulting" report — gated behind login + Pro plan.
  // Free users see a static demo on /cro and an upsell when they try to run
  // a real analysis. This keeps unit economics sane (Gemini calls cost real
  // money for ~18k chars of context) and creates a clear $19/mo upgrade hook.
  const auth = await resolvePlan(req);
  if (!auth.userId) {
    return NextResponse.json(
      {
        error: "Sign in required",
        code: "AUTH_REQUIRED",
      },
      { status: 401 }
    );
  }
  if (auth.plan !== "pro") {
    return NextResponse.json(
      {
        error: "CRO leak analysis is a Pro feature",
        code: "PRO_REQUIRED",
      },
      { status: 402 }
    );
  }

  try {
    const analysis = await runCROAnalysis(parsed.data.url);
    await saveCROAnalysis(analysis, auth.userId);
    return NextResponse.json({ analysis });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "CRO analysis failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function resolvePlan(
  req: Request
): Promise<{ userId: string | null; plan: "free" | "pro" }> {
  if (!isSupabaseConfigured) return { userId: null, plan: "free" };
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return { userId: null, plan: "free" };
  const sb = getAdminSupabase();
  if (!sb) return { userId: null, plan: "free" };
  const { data: u } = await sb.auth.getUser(auth.slice("Bearer ".length));
  const userId = u.user?.id ?? null;
  if (!userId) return { userId: null, plan: "free" };
  const { data: profile } = await sb
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();
  return {
    userId,
    plan: profile?.plan === "pro" ? "pro" : "free",
  };
}
