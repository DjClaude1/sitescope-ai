import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

// Stripe webhook — flips profiles.plan on subscription events.
// Verifies the Stripe-Signature header using the raw request body and
// STRIPE_WEBHOOK_SECRET. Unsigned/forged requests return 400.

async function resolveProfileId(
  sb: ReturnType<typeof getAdminSupabase>,
  args: { userId?: string | null; email?: string | null }
): Promise<string | null> {
  if (!sb) return null;
  if (args.userId) {
    const { data } = await sb
      .from("profiles")
      .select("id")
      .eq("id", args.userId)
      .maybeSingle();
    if (data?.id) return data.id;
  }
  if (args.email) {
    const { data } = await sb
      .from("profiles")
      .select("id")
      .eq("email", args.email)
      .maybeSingle();
    if (data?.id) return data.id;
  }
  return null;
}

async function setPlan(
  sb: ReturnType<typeof getAdminSupabase>,
  profileId: string,
  plan: "free" | "pro",
  updates: {
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
  } = {}
) {
  if (!sb) return false;
  const { error } = await sb
    .from("profiles")
    .update({
      plan,
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);
  if (error) {
    console.error("[stripe] profile update failed", error);
    return false;
  }
  return true;
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !whSecret) {
    return NextResponse.json(
      { ok: false, error: "stripe_not_configured" },
      { status: 501 }
    );
  }

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { ok: false, error: "missing_signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret);
  } catch (e) {
    const message = e instanceof Error ? e.message : "signature_error";
    console.warn("[stripe] signature verification failed:", message);
    return NextResponse.json(
      { ok: false, error: "invalid_signature" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: true, skipped: "supabase_not_configured" });
  }
  const sb = getAdminSupabase();
  if (!sb) {
    return NextResponse.json({ ok: false, error: "no_admin" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const userId =
          (session.metadata?.supabase_user_id as string | undefined) ||
          session.client_reference_id ||
          null;
        const email =
          session.customer_details?.email || session.customer_email || null;
        const profileId = await resolveProfileId(sb, { userId, email });
        if (!profileId) {
          console.warn("[stripe] no profile for checkout.session.completed", {
            userId,
            email,
          });
          return NextResponse.json(
            { ok: false, error: "profile_not_found" },
            { status: 500 }
          );
        }
        await setPlan(sb, profileId, "pro", {
          stripe_customer_id:
            typeof session.customer === "string" ? session.customer : null,
          stripe_subscription_id:
            typeof session.subscription === "string"
              ? session.subscription
              : null,
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id as string | undefined;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : null;
        // Look up profile by Stripe customer id first (stable across
        // future events), then fall back to metadata user id.
        let profileId: string | null = null;
        if (customerId) {
          const { data } = await sb
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          profileId = data?.id ?? null;
        }
        if (!profileId) {
          profileId = await resolveProfileId(sb, { userId });
        }
        if (!profileId) break;
        const active = ["active", "trialing"].includes(sub.status);
        await setPlan(sb, profileId, active ? "pro" : "free", {
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : null;
        let profileId: string | null = null;
        if (customerId) {
          const { data } = await sb
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          profileId = data?.id ?? null;
        }
        if (!profileId) {
          const userId = sub.metadata?.supabase_user_id as string | undefined;
          profileId = await resolveProfileId(sb, { userId });
        }
        if (profileId) {
          await setPlan(sb, profileId, "free", {
            stripe_subscription_id: null,
          });
        }
        break;
      }

      default:
        // Ignore other events (invoice.*, charge.*, etc) — they're not
        // actionable for our plan-flip logic.
        break;
    }
  } catch (e) {
    console.error("[stripe] handler error", e);
    return NextResponse.json({ ok: false, error: "handler_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
