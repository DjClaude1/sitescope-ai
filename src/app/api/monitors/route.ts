import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { assertPublicUrl } from "@/lib/ssrf";

export const runtime = "nodejs";

// CRUD for per-user monitored URLs. Pro-only — we gate both on profile.plan
// and on a hard cap (6 monitors per account) to keep the weekly cron bounded.
const MAX_MONITORS_PER_USER = 6;

const PostBody = z.object({
  url: z.string().url().max(2048),
});

async function resolveUser(req: Request) {
  if (!isSupabaseConfigured) return null;
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length);
  const sb = getAdminSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser(token);
  return data.user ?? null;
}

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  const parsed = new URL(u);
  if (!parsed.hostname.includes(".")) throw new Error("invalid host");
  return parsed.toString();
}

export async function GET(req: Request) {
  const user = await resolveUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getAdminSupabase();
  if (!sb) return NextResponse.json({ error: "no_admin" }, { status: 500 });

  const [{ data: profile }, { data: monitors }] = await Promise.all([
    sb.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
    sb
      .from("monitors")
      .select("id,url,last_score,last_audited_at,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);
  return NextResponse.json({
    plan: profile?.plan ?? "free",
    max: MAX_MONITORS_PER_USER,
    monitors: monitors ?? [],
  });
}

export async function POST(req: Request) {
  const user = await resolveUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getAdminSupabase();
  if (!sb) return NextResponse.json({ error: "no_admin" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const parsed = PostBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  let normalized: string;
  try {
    normalized = normalizeUrl(parsed.data.url);
    await assertPublicUrl(normalized);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  const { data: profile } = await sb
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.plan !== "pro") {
    return NextResponse.json({ error: "pro_required" }, { status: 402 });
  }

  const { count } = await sb
    .from("monitors")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= MAX_MONITORS_PER_USER) {
    return NextResponse.json({ error: "limit_reached" }, { status: 409 });
  }

  // Dedupe on (user_id, url) so double-clicks don't create duplicate rows.
  const { data: existing } = await sb
    .from("monitors")
    .select("id")
    .eq("user_id", user.id)
    .eq("url", normalized)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, id: existing.id, dedup: true });
  }

  const { data: inserted, error } = await sb
    .from("monitors")
    .insert({ user_id: user.id, url: normalized })
    .select("id")
    .single();
  if (error || !inserted) {
    console.error("[monitors] insert failed", error);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: inserted.id });
}

export async function DELETE(req: Request) {
  const user = await resolveUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getAdminSupabase();
  if (!sb) return NextResponse.json({ error: "no_admin" }, { status: 500 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  const { error } = await sb
    .from("monitors")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    console.error("[monitors] delete failed", error);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
