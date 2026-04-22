import { NextResponse } from "next/server";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

// PayPal webhook — marks a user Pro on subscription activation
// and downgrades on cancellation/expiry. Assumes PayPal webhook delivers
// custom_id or subscriber.email_address that matches the profile.
//
// Signature verification: calls PayPal's verify-webhook-signature API with
// the delivered transmission headers + raw body. Required in prod.
// Set PAYPAL_WEBHOOK_ID to the ID of the webhook configured in the PayPal
// dashboard. In non-prod you can set PAYPAL_WEBHOOK_SKIP_VERIFY=1 to bypass
// verification for local smoke tests only.

const PAYPAL_API_BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPaypalAccessToken(): Promise<string | null> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) return null;
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

async function verifyPaypalSignature(
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  const token = await getPaypalAccessToken();
  if (!token) return false;

  const required = [
    "paypal-auth-algo",
    "paypal-cert-url",
    "paypal-transmission-id",
    "paypal-transmission-sig",
    "paypal-transmission-time",
  ] as const;
  const values: Record<string, string> = {};
  for (const h of required) {
    const v = headers.get(h);
    if (!v) return false;
    values[h] = v;
  }

  let webhookEvent: unknown;
  try {
    webhookEvent = JSON.parse(rawBody);
  } catch {
    return false;
  }

  const res = await fetch(
    `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: values["paypal-auth-algo"],
        cert_url: values["paypal-cert-url"],
        transmission_id: values["paypal-transmission-id"],
        transmission_sig: values["paypal-transmission-sig"],
        transmission_time: values["paypal-transmission-time"],
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      }),
    }
  );
  if (!res.ok) return false;
  const json = (await res.json()) as { verification_status?: string };
  return json.verification_status === "SUCCESS";
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  // Signature verification gate
  const skipVerify = process.env.PAYPAL_WEBHOOK_SKIP_VERIFY === "1";
  if (!skipVerify) {
    const ok = await verifyPaypalSignature(req.headers, rawBody);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "invalid_signature" },
        { status: 401 }
      );
    }
  }

  let event: {
    event_type?: string;
    resource?: {
      id?: string;
      custom_id?: string;
      subscriber?: { email_address?: string };
    };
  } | null = null;
  try {
    event = JSON.parse(rawBody);
  } catch {
    event = null;
  }
  if (!event) return NextResponse.json({ ok: false }, { status: 400 });

  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: true, skipped: "supabase_not_configured" });
  }
  const sb = getAdminSupabase();
  if (!sb) return NextResponse.json({ ok: false }, { status: 500 });

  const type = event.event_type;
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

  // The profiles.id column is NOT NULL and references auth.users(id), so a
  // blind upsert on email will fail when the profile hasn't been created
  // yet. Look up the existing profile first; if it's missing, return 500
  // so PayPal retries later (the auth trigger will have created the row by
  // then, or the user will have signed up). This prevents paid users from
  // silently never being upgraded.
  const { data: existing, error: lookupError } = await sb
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) {
    console.error("[paypal] profile lookup failed", lookupError);
    return NextResponse.json(
      { ok: false, error: "profile_lookup_failed" },
      { status: 500 }
    );
  }
  if (!existing) {
    console.warn("[paypal] no profile for email, ask PayPal to retry", email);
    return NextResponse.json(
      { ok: false, error: "profile_not_found", email },
      { status: 500 }
    );
  }

  const { error: updateError } = await sb
    .from("profiles")
    .update({
      plan,
      paypal_subscription_id: resource.id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);
  if (updateError) {
    console.error("[paypal] profile update failed", updateError);
    return NextResponse.json(
      { ok: false, error: "profile_update_failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
