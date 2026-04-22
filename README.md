# SiteScope AI

**Instant AI-powered website audits — SEO, performance, accessibility, conversion, content.**

Paste a URL, get a consultant-grade report in under a minute. Ship fixes the same day.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DjClaude1/sitescope-ai)

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" />
  <img src="https://img.shields.io/badge/Supabase-free%20tier-3ECF8E?logo=supabase" />
  <img src="https://img.shields.io/badge/Gemini-free%20tier-4285F4?logo=google" />
  <img src="https://img.shields.io/badge/PayPal-subscriptions-00457C?logo=paypal" />
</p>

## Why this will make you money

- **Agencies & freelancers** run 20 prospect audits an hour, send a branded PDF, close retainers.
- **SEO consultants** use the scored report as a kickoff deliverable worth $500+.
- **Founders** audit their landing page before running ads — every wasted click is real money.
- Public audit URLs are shareable → built-in viral loop → free SEO.

Pricing is baked in:

| Plan | Price | Includes |
| ---- | ----- | -------- |
| Free | $0    | 3 audits/day, all categories, shareable report |
| Pro  | $19/mo | Unlimited audits, PDF export, weekly monitoring + email, competitor compare, API |

## Zero-cost stack

Every service has a **generous free tier** — you can run this SaaS at $0/mo until you have paying customers.

- **Next.js 14** (App Router, TypeScript, Tailwind) → deploy free on Vercel
- **Google Gemini 1.5 Flash** → free tier, 15 RPM, 1M tokens/day
- **Supabase** (Auth + Postgres) → free tier, 500MB DB, 50k MAUs
- **PayPal** subscriptions → no card needed, 2.9% + $0.30 per payment
- **Resend** (transactional email) → free tier, 3k emails/mo
- **Vercel Cron** → free tier, 2 crons on Hobby plan

## Quickstart

```bash
git clone https://github.com/DjClaude1/sitescope-ai.git
cd sitescope-ai
npm install
cp .env.example .env.local
# minimum: set GEMINI_API_KEY
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). The landing page lets you run audits with zero configuration beyond the Gemini key.

### Enabling auth, history, and Pro billing

1. Create a free Supabase project → copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` into `.env.local`.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor.
3. Create a PayPal billing plan at https://www.paypal.com/billing/plans (or use sandbox first) → set the `PAYPAL_*` and `NEXT_PUBLIC_PAYPAL_*` env vars.
4. Configure a PayPal webhook pointing at `/api/webhook/paypal` (events: `BILLING.SUBSCRIPTION.ACTIVATED`, `*.CANCELLED`, `*.EXPIRED`).
5. (Optional) Add Resend for weekly monitoring emails — `RESEND_API_KEY`, `RESEND_FROM`.

### Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Or click **Deploy with Vercel** above. Paste env vars during setup. The `vercel.json` enables the weekly monitoring cron out of the box.

## Architecture

```
src/
├── app/
│   ├── page.tsx                     # Landing
│   ├── audit/[id]/page.tsx          # Public shareable report
│   ├── pricing/page.tsx             # PayPal-powered Pro checkout
│   ├── login/page.tsx               # Supabase magic-link
│   ├── dashboard/page.tsx           # User audit history
│   └── api/
│       ├── audit/route.ts           # POST {url} → AuditReport
│       ├── report/[id]/route.ts     # GET cached/stored report
│       ├── checkout/route.ts        # Server-side PayPal fallback
│       ├── webhook/paypal/route.ts  # Activate/downgrade Pro on events
│       └── cron/monitor/route.ts    # Weekly Pro monitoring + email
├── lib/
│   ├── scrape.ts                    # Cheerio-based HTML parser + signals
│   ├── audit.ts                     # Heuristic + Gemini merge, scoring
│   ├── gemini.ts                    # GoogleGenerativeAI JSON-mode client
│   ├── supabase.ts                  # Optional Supabase clients
│   ├── storage.ts                   # Audit + usage persistence
│   ├── plan.ts                      # Free/Pro gating logic
│   └── types.ts
└── components/                      # Navbar, AuditForm, ScoreRing, …
```

## How the audit works

1. **Fetch** the target URL (15s timeout, 1.5MB cap) with a polite `SiteScopeAI/1.0` UA.
2. **Parse** HTML with Cheerio to extract ~40 signals: meta, headings, images, links, CTAs, schema, analytics, OG/Twitter, forms, word count.
3. **Heuristics** fire ~25 deterministic checks for common issues with severity and recommendations.
4. **Gemini** gets the full signal bundle + visible-text sample and returns an executive summary, AI issues, quick wins, and refined scores. If the API fails or isn't configured, heuristics stand alone.
5. **Merge** AI + heuristic issues (dedup), compute per-category scores, write to storage, return to the UI.

## License

MIT — do whatever, including selling it.
