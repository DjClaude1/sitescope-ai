import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

// Creates a Stripe Checkout Session for the Pro subscription and returns
// the hosted-checkout URL. The client-side pricing page redirects the
// browser to `url`. Signed-in users are attached via `customer_email`
// plus a `client_reference_id` that points at the Supabase user id so the
// webhook can flip plan→pro deterministically.

function appUrl(req: Request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    new URL(req.url).origin ||
    "https://sitescope-ai-kappa.vercel.app"
  );
}

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "stripe_not_configured", code: "STRIPE_NOT_CONFIGURED" },
      { status: 501 }
    );
  }
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 501 });
  }
  const priceId = process.env.STRIPE_PRICE_ID!;

  // Resolve signed-in user (optional — guests can still subscribe via
  // email-only). If the request carries a Supabase bearer token we pull
  // the user's id + email so the webhook can match them directly.
  let userId: string | undefined;
  let email: string | undefined;
  if (isSupabaseConfigured) {
    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice("Bearer ".length);
      const sb = getAdminSupabase();
      if (sb) {
        const { data } = await sb.auth.getUser(token);
        userId = data.user?.id;
        email = data.user?.email ?? undefined;
      }
    }
  }

  const base = appUrl(req);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/dashboard?upgraded=1&provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/pricing?cancelled=1`,
      allow_promotion_codes: true,
      client_reference_id: userId,
      customer_email: email,
      // Subscriptions inherit metadata into the `Subscription` object so
      // the webhook can read `metadata.user_id` on every billing event.
      subscription_data: userId
        ? { metadata: { supabase_user_id: userId } }
        : undefined,
      metadata: userId ? { supabase_user_id: userId } : {},
    });
    if (!session.url) {
      return NextResponse.json({ error: "no_session_url" }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "checkout_failed";
    console.error("[stripe] checkout error", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
