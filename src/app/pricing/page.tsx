"use client";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
const PAYPAL_PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || "";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  async function handleServerCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "PAYPAL_NOT_CONFIGURED") {
          toast.error("PayPal not configured. Add PAYPAL_* env vars.");
          return;
        }
        throw new Error(data.error || "Checkout failed");
      }
      if (data.approveUrl) window.location.href = data.approveUrl;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-5 py-16">
        <div className="text-center mb-12">
          <div className="chip mb-4">Pricing</div>
          <h1 className="text-4xl md:text-5xl font-semibold mb-4">
            Recover the cost in one client.
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            Start free. Upgrade when you want unlimited audits, branded PDFs, and
            weekly monitoring alerts.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="card">
            <div className="chip mb-3">Free</div>
            <div className="text-4xl font-semibold mb-1">$0</div>
            <div className="text-white/50 mb-6">forever · no card required</div>
            <ul className="space-y-2 text-sm text-white/80 mb-8">
              <Li>3 audits per day</Li>
              <Li>All 5 scoring categories</Li>
              <Li>AI-written recommendations</Li>
              <Li>Shareable public report URL</Li>
              <Li>Markdown export</Li>
            </ul>
            <Link href="/#run" className="btn btn-ghost w-full">
              Run a free audit
            </Link>
          </div>

          <div className="card relative border border-brand/40 glow">
            <div className="chip mb-3">Pro · most popular</div>
            <div className="text-4xl font-semibold mb-1">$19<span className="text-lg text-white/40">/mo</span></div>
            <div className="text-white/50 mb-6">cancel anytime · PayPal billing</div>
            <ul className="space-y-2 text-sm text-white/80 mb-8">
              <Li>Unlimited audits</Li>
              <Li>Branded PDF export</Li>
              <Li>Weekly monitoring + email alerts</Li>
              <Li>Competitor comparison</Li>
              <Li>Audit history dashboard</Li>
              <Li>API access (Beta)</Li>
              <Li>Priority AI queue</Li>
            </ul>
            {PAYPAL_CLIENT_ID && PAYPAL_PLAN_ID ? (
              <PayPalScriptProvider
                options={{
                  clientId: PAYPAL_CLIENT_ID,
                  vault: true,
                  intent: "subscription",
                }}
              >
                <PayPalButtons
                  style={{
                    layout: "vertical",
                    color: "gold",
                    label: "subscribe",
                  }}
                  createSubscription={async (_d, actions) => {
                    const userEmail = isSupabaseConfigured
                      ? (await getBrowserSupabase()?.auth.getUser())?.data.user
                          ?.email
                      : undefined;
                    return actions.subscription.create({
                      plan_id: PAYPAL_PLAN_ID,
                      custom_id: userEmail,
                      subscriber: userEmail
                        ? {
                            email_address: userEmail,
                            name: { given_name: "SiteScope", surname: "User" },
                          }
                        : undefined,
                    });
                  }}
                  onApprove={async () => {
                    toast.success("Subscription active — welcome to Pro!");
                    window.location.href = "/dashboard?upgraded=1";
                  }}
                  onError={() => toast.error("PayPal error — please try again")}
                />
              </PayPalScriptProvider>
            ) : (
              <button
                onClick={handleServerCheckout}
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Redirecting…
                  </>
                ) : (
                  "Upgrade to Pro"
                )}
              </button>
            )}
            {!(PAYPAL_CLIENT_ID && PAYPAL_PLAN_ID) && (
              <p className="mt-3 text-xs text-white/40 text-center">
                PayPal not yet configured — set NEXT_PUBLIC_PAYPAL_CLIENT_ID and
                NEXT_PUBLIC_PAYPAL_PLAN_ID to enable subscriptions.
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-white/50 mt-10">
          Need an agency plan (white-label, bulk)?{" "}
          <a
            href="mailto:hello@sitescope.ai"
            className="underline decoration-dotted"
          >
            Email us
          </a>
          .
        </p>
      </main>
      <Footer />
    </>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
