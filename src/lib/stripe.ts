import Stripe from "stripe";

// Lazy-initialized Stripe client. Returns null if `STRIPE_SECRET_KEY` is
// unset so the app keeps booting in environments without Stripe (CI,
// early deploys) instead of crashing at import time.
let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // Omit `apiVersion` — Stripe's Node library defaults to the account's
  // pinned version, which is what we want. Passing a specific literal
  // here creates an annoying TS-version drift problem on upgrades.
  cached = new Stripe(key, { typescript: true });
  return cached;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}
