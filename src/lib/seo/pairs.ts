// Competitor-pair seeds for programmatic SEO on /compare/[a]/[b].
//
// We ship a hand-picked list of "natural rival" pairs (e.g. stripe vs paddle,
// vercel vs netlify) — these are the searches users actually run. Each pair
// becomes a sitemap entry and, once crawled, a permanently cached
// `/compare/[a]/[b]` page via ISR.

export type Pair = readonly [string, string];

export const COMPETITOR_PAIRS: readonly Pair[] = [
  // Payments / fintech
  ["stripe.com", "paypal.com"],
  ["stripe.com", "adyen.com"],
  ["stripe.com", "square.com"],
  ["stripe.com", "paddle.com"],
  ["stripe.com", "braintreepayments.com"],
  ["paypal.com", "square.com"],
  ["paypal.com", "venmo.com"],
  ["wise.com", "paypal.com"],
  ["wise.com", "revolut.com"],
  ["revolut.com", "chime.com"],
  ["klarna.com", "affirm.com"],
  ["klarna.com", "afterpay.com"],
  ["affirm.com", "afterpay.com"],
  ["ramp.com", "brex.com"],
  ["mercury.com", "brex.com"],

  // Hosting / deploy platforms
  ["vercel.com", "netlify.com"],
  ["vercel.com", "cloudflare.com"],
  ["vercel.com", "render.com"],
  ["vercel.com", "railway.app"],
  ["vercel.com", "fly.io"],
  ["netlify.com", "cloudflare.com"],
  ["netlify.com", "render.com"],
  ["render.com", "railway.app"],
  ["render.com", "fly.io"],
  ["fly.io", "railway.app"],
  ["heroku.com", "render.com"],
  ["heroku.com", "fly.io"],

  // Databases / backend
  ["supabase.com", "firebase.google.com"],
  ["supabase.com", "planetscale.com"],
  ["supabase.com", "neon.tech"],
  ["planetscale.com", "neon.tech"],
  ["neon.tech", "turso.tech"],
  ["mongodb.com", "supabase.com"],
  ["mongodb.com", "firebase.google.com"],
  ["auth0.com", "clerk.com"],
  ["auth0.com", "supabase.com"],

  // Dev productivity / CI / code hosting
  ["github.com", "gitlab.com"],
  ["github.com", "bitbucket.org"],
  ["gitlab.com", "bitbucket.org"],
  ["circleci.com", "travis-ci.com"],
  ["sentry.io", "rollbar.com"],
  ["sentry.io", "bugsnag.com"],
  ["datadoghq.com", "new-relic.com"],
  ["datadoghq.com", "dynatrace.com"],

  // Productivity / collaboration
  ["notion.so", "linear.app"],
  ["notion.so", "airtable.com"],
  ["notion.so", "coda.io"],
  ["notion.so", "evernote.com"],
  ["notion.so", "obsidian.md"],
  ["notion.so", "roamresearch.com"],
  ["linear.app", "jira.com"],
  ["linear.app", "asana.com"],
  ["asana.com", "monday.com"],
  ["asana.com", "clickup.com"],
  ["asana.com", "trello.com"],
  ["monday.com", "clickup.com"],
  ["monday.com", "trello.com"],
  ["trello.com", "clickup.com"],
  ["basecamp.com", "asana.com"],
  ["airtable.com", "coda.io"],
  ["obsidian.md", "roamresearch.com"],
  ["obsidian.md", "logseq.com"],
  ["evernote.com", "onenote.com"],
  ["todoist.com", "ticktick.com"],
  ["todoist.com", "anydo.com"],

  // Communication / meetings
  ["slack.com", "discord.com"],
  ["slack.com", "teams.microsoft.com"],
  ["zoom.us", "meet.google.com"],
  ["zoom.us", "teams.microsoft.com"],
  ["loom.com", "vidyard.com"],
  ["calendly.com", "cal.com"],
  ["calendly.com", "doodle.com"],
  ["superhuman.com", "hey.com"],

  // Design / creative
  ["figma.com", "sketch.com"],
  ["figma.com", "adobexd.com"],
  ["figma.com", "framer.com"],
  ["figma.com", "invisionapp.com"],
  ["figma.com", "canva.com"],
  ["canva.com", "adobe.com"],
  ["canva.com", "visme.co"],
  ["framer.com", "webflow.com"],
  ["framer.com", "wix.com"],
  ["framer.com", "squarespace.com"],
  ["webflow.com", "wordpress.com"],
  ["webflow.com", "squarespace.com"],
  ["webflow.com", "wix.com"],
  ["wix.com", "squarespace.com"],
  ["wix.com", "wordpress.com"],
  ["squarespace.com", "wordpress.com"],

  // E-commerce platforms
  ["shopify.com", "bigcommerce.com"],
  ["shopify.com", "woocommerce.com"],
  ["shopify.com", "wix.com"],
  ["shopify.com", "squarespace.com"],
  ["shopify.com", "etsy.com"],
  ["amazon.com", "ebay.com"],
  ["amazon.com", "walmart.com"],
  ["amazon.com", "etsy.com"],
  ["amazon.com", "aliexpress.com"],
  ["walmart.com", "target.com"],
  ["walmart.com", "costco.com"],
  ["etsy.com", "ebay.com"],
  ["aliexpress.com", "alibaba.com"],
  ["asos.com", "zalando.com"],
  ["nike.com", "adidas.com"],

  // CRM / sales / marketing
  ["hubspot.com", "salesforce.com"],
  ["hubspot.com", "pipedrive.com"],
  ["hubspot.com", "zoho.com"],
  ["salesforce.com", "pipedrive.com"],
  ["intercom.com", "zendesk.com"],
  ["intercom.com", "freshworks.com"],
  ["intercom.com", "drift.com"],
  ["zendesk.com", "freshworks.com"],
  ["zendesk.com", "helpscout.com"],
  ["mailchimp.com", "klaviyo.com"],
  ["mailchimp.com", "convertkit.com"],
  ["mailchimp.com", "activecampaign.com"],
  ["klaviyo.com", "convertkit.com"],
  ["convertkit.com", "substack.com"],
  ["sendgrid.com", "postmarkapp.com"],
  ["sendgrid.com", "mailgun.com"],
  ["resend.com", "sendgrid.com"],
  ["resend.com", "postmarkapp.com"],

  // Analytics / product
  ["segment.com", "mixpanel.com"],
  ["segment.com", "amplitude.com"],
  ["amplitude.com", "mixpanel.com"],
  ["amplitude.com", "heap.io"],
  ["mixpanel.com", "heap.io"],
  ["posthog.com", "mixpanel.com"],
  ["posthog.com", "amplitude.com"],
  ["hotjar.com", "fullstory.com"],
  ["hotjar.com", "crazyegg.com"],
  ["hotjar.com", "microsoft.com"],

  // SEO tools
  ["semrush.com", "ahrefs.com"],
  ["semrush.com", "moz.com"],
  ["ahrefs.com", "moz.com"],
  ["ahrefs.com", "similarweb.com"],
  ["semrush.com", "similarweb.com"],

  // AI labs / products
  ["openai.com", "anthropic.com"],
  ["openai.com", "mistral.ai"],
  ["openai.com", "cohere.com"],
  ["openai.com", "huggingface.co"],
  ["anthropic.com", "mistral.ai"],
  ["anthropic.com", "cohere.com"],
  ["perplexity.ai", "you.com"],
  ["perplexity.ai", "chat.openai.com"],
  ["midjourney.com", "stability.ai"],
  ["midjourney.com", "runwayml.com"],
  ["runwayml.com", "stability.ai"],
  ["elevenlabs.io", "replicate.com"],
  ["jasper.ai", "copy.ai"],
  ["jasper.ai", "writer.com"],
  ["copy.ai", "writer.com"],
  ["character.ai", "replika.com"],
  ["cursor.com", "github.com"],
  ["cursor.com", "codeium.com"],
  ["codeium.com", "tabnine.com"],

  // Streaming / media
  ["netflix.com", "disneyplus.com"],
  ["netflix.com", "hulu.com"],
  ["netflix.com", "max.com"],
  ["netflix.com", "primevideo.com"],
  ["disneyplus.com", "hulu.com"],
  ["disneyplus.com", "max.com"],
  ["youtube.com", "twitch.tv"],
  ["youtube.com", "vimeo.com"],
  ["spotify.com", "apple.com"],
  ["spotify.com", "soundcloud.com"],
  ["spotify.com", "tidal.com"],
  ["spotify.com", "pandora.com"],
  ["tidal.com", "apple.com"],

  // Social
  ["x.com", "threads.net"],
  ["x.com", "bluesky.app"],
  ["threads.net", "bluesky.app"],
  ["facebook.com", "instagram.com"],
  ["instagram.com", "tiktok.com"],
  ["instagram.com", "snapchat.com"],
  ["tiktok.com", "snapchat.com"],
  ["linkedin.com", "indeed.com"],
  ["linkedin.com", "glassdoor.com"],
  ["reddit.com", "quora.com"],
  ["medium.com", "substack.com"],
  ["substack.com", "beehiiv.com"],

  // Travel
  ["airbnb.com", "vrbo.com"],
  ["airbnb.com", "booking.com"],
  ["booking.com", "expedia.com"],
  ["booking.com", "hotels.com"],
  ["expedia.com", "hotels.com"],
  ["expedia.com", "priceline.com"],
  ["tripadvisor.com", "yelp.com"],
  ["kayak.com", "skyscanner.com"],
  ["kayak.com", "priceline.com"],
  ["hilton.com", "marriott.com"],
  ["hilton.com", "hyatt.com"],
  ["marriott.com", "hyatt.com"],
  ["united.com", "delta.com"],
  ["delta.com", "americanairlines.com"],
  ["britishairways.com", "emirates.com"],

  // Crypto / exchanges
  ["coinbase.com", "binance.com"],
  ["coinbase.com", "kraken.com"],
  ["coinbase.com", "gemini.com"],
  ["binance.com", "kraken.com"],
  ["binance.com", "bybit.com"],
  ["binance.com", "okx.com"],
  ["kraken.com", "gemini.com"],
  ["robinhood.com", "coinbase.com"],
  ["uniswap.org", "sushi.com"],
  ["opensea.io", "magiceden.io"],
  ["metamask.io", "phantom.app"],

  // Health / wellness
  ["calm.com", "headspace.com"],
  ["myfitnesspal.com", "noom.com"],
  ["fitbit.com", "whoop.com"],
  ["fitbit.com", "oura.com"],
  ["whoop.com", "oura.com"],
  ["peloton.com", "apple.com"],
  ["hims.com", "ro.co"],
  ["hers.co", "ro.co"],
  ["teladoc.com", "zocdoc.com"],

  // Education
  ["coursera.org", "udemy.com"],
  ["coursera.org", "edx.org"],
  ["udemy.com", "skillshare.com"],
  ["udemy.com", "pluralsight.com"],
  ["edx.org", "khanacademy.org"],
  ["codecademy.com", "pluralsight.com"],
  ["codecademy.com", "datacamp.com"],
  ["duolingo.com", "babbel.com"],
  ["duolingo.com", "rosettastone.com"],
  ["masterclass.com", "skillshare.com"],

  // Misc high-traffic rivalries
  ["google.com", "bing.com"],
  ["google.com", "duckduckgo.com"],
  ["chrome.google.com", "mozilla.org"],
  ["apple.com", "microsoft.com"],
  ["apple.com", "samsung.com"],
  ["cloudflare.com", "fastly.com"],
  ["cloudflare.com", "akamai.com"],
] as const;

// Canonicalize a pair (lowercase, no "www.", sort alphabetically so
// `stripe.com,paypal.com` and `paypal.com,stripe.com` collapse to the
// same key) and dedupe.
function canonicalize(pair: Pair): Pair {
  const a = pair[0].toLowerCase().replace(/^www\./, "");
  const b = pair[1].toLowerCase().replace(/^www\./, "");
  return a < b ? [a, b] : [b, a];
}

function dedupe(list: readonly Pair[]): Pair[] {
  const seen = new Set<string>();
  const out: Pair[] = [];
  for (const pair of list) {
    if (pair[0] === pair[1]) continue;
    const canon = canonicalize(pair);
    const key = `${canon[0]}|${canon[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(canon);
  }
  return out;
}

export const UNIQUE_PAIRS: readonly Pair[] = dedupe(COMPETITOR_PAIRS);

// Popular matchups surfaced on /compare — handpicked subset that reads well
// in a grid of cards. Order preserved (not canonicalized) so the user sees
// "stripe vs paypal" rather than alphabetical "paypal vs stripe".
export const FEATURED_PAIRS: readonly Pair[] = [
  ["stripe.com", "paypal.com"],
  ["vercel.com", "netlify.com"],
  ["notion.so", "linear.app"],
  ["figma.com", "canva.com"],
  ["shopify.com", "bigcommerce.com"],
  ["openai.com", "anthropic.com"],
  ["supabase.com", "firebase.google.com"],
  ["github.com", "gitlab.com"],
  ["airbnb.com", "booking.com"],
  ["hubspot.com", "salesforce.com"],
  ["slack.com", "discord.com"],
  ["netflix.com", "disneyplus.com"],
];
