import { NextResponse } from "next/server";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

// Minimal PayPal webhook — marks a user Pro on subscription activation
// and downgrades on cancellation/expiry. Assumes PayPal webhook delivers
// custom_id or subscriber.email_address that matches the profile.
export async function POST(req: Request) {
  const event = await req.json().catch(() => null);
  if (!event) return NextResponse.json({ ok: false }, { status: 400 });

  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: true, skipped: "supabase_not_configured" });
  }
  const sb = getAdminSupabase();
  if (!sb) return NextResponse.json({ ok: false }, { status: 500 });

  const type = event.event_type as string | undefined;
  const resource = event.resource || {};
  const email: string | undefined =
    resource.subscriber?.email_address || resource.custom_id;
  if (!email) return NextResponse.json({ ok: true, skipped: "no_email" });

  const plan =
    type === "BILLING.SUBSCRIPTION.ACTIVATED" ||
    type === "PAYMENT.SALE.COMPLETED"
      ? "pro"
      : type === "BILLING.SUBSCRIPTION.CANCELLED" ||
          type === "BILLING.SUBSCRIPTION.EXPIRED" ||
          type === "BILLING.SUBSCRIPTION.SUSPENDED"
        ? "free"
        : null;
  if (!plan) return NextResponse.json({ ok: true, ignored: type });

  await sb.from("profiles").upsert(
    {
      email,
      plan,
      paypal_subscription_id: resource.id || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );
  return NextResponse.json({ ok: true });
}
