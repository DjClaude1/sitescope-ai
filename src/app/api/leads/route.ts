import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const schema = z.object({
  business: z.string().trim().min(2).max(120),
  website: z.string().trim().url().max(500),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(80).optional(),
  problem: z.string().trim().min(5).max(2000),
  website2: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.website2) return NextResponse.json({ ok: true });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check the form fields and try again." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: "Lead capture is temporarily unavailable. Please email us directly." }, { status: 503 });
    }

    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.from("lead_submissions").insert({
      business: parsed.data.business,
      website: parsed.data.website,
      email: parsed.data.email || null,
      whatsapp: parsed.data.whatsapp || null,
      problem: parsed.data.problem,
    });

    if (error) {
      console.error("lead_submission_error", error);
      return NextResponse.json({ error: "We couldn't save your request. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("lead_submission_exception", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
