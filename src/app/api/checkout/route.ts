import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Creates a PayPal subscription redirect. Client-side uses @paypal/react-paypal-js
// buttons to create subscriptions directly; this endpoint is a fallback for servers
// that prefer server-side creation.
export async function POST() {
  const planId = process.env.PAYPAL_PLAN_ID;
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const base =
    process.env.PAYPAL_ENV === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  if (!planId || !clientId || !secret) {
    return NextResponse.json(
      { error: "PayPal not configured", code: "PAYPAL_NOT_CONFIGURED" },
      { status: 501 }
    );
  }

  const tokRes = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!tokRes.ok) {
    return NextResponse.json({ error: "PayPal auth failed" }, { status: 502 });
  }
  const { access_token } = (await tokRes.json()) as { access_token: string };

  const origin =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const subRes = await fetch(`${base}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: planId,
      application_context: {
        brand_name: "SiteScope AI",
        user_action: "SUBSCRIBE_NOW",
        return_url: `${origin}/dashboard?upgraded=1`,
        cancel_url: `${origin}/pricing?cancelled=1`,
      },
    }),
  });
  if (!subRes.ok) {
    const txt = await subRes.text();
    return NextResponse.json(
      { error: "PayPal subscription create failed", detail: txt },
      { status: 502 }
    );
  }
  const sub = await subRes.json();
  const approve = (sub.links || []).find(
    (l: { rel: string; href: string }) => l.rel === "approve"
  );
  return NextResponse.json({ subscriptionId: sub.id, approveUrl: approve?.href });
}
