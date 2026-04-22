import * as cheerio from "cheerio";
import type { PageSignals } from "./types";
import { assertPublicUrl, SsrfBlockedError } from "./ssrf";

export interface ScrapeResult {
  finalUrl: string;
  statusCode: number;
  html: string;
  loadTimeMs: number;
  signals: PageSignals;
  visibleText: string;
}

const MAX_BYTES = 1_500_000; // 1.5MB cap
const TOTAL_TIMEOUT_MS = 20_000; // covers headers + body drain
const MAX_REDIRECTS = 5;

const COMMON_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; SiteScopeAI/1.0; +https://sitescope.ai/bot)",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function scrape(url: string): Promise<ScrapeResult> {
  const started = Date.now();
  // Single abort timer covers the whole request — headers AND the body
  // reading loop. A slow-body attack can't out-wait us.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TOTAL_TIMEOUT_MS);

  try {
    // Manual redirect handling: fetch's built-in redirect follower bypasses
    // our SSRF gate for any subsequent hop. We re-validate every target.
    let currentUrl = url;
    let res: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertPublicUrl(currentUrl);
      const r: Response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: "manual",
        headers: COMMON_HEADERS,
      });
      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get("location");
        // Drain the redirect body so the connection can be reused.
        r.body?.cancel().catch(() => {});
        if (!loc) {
          res = r;
          break;
        }
        if (hop === MAX_REDIRECTS) {
          throw new Error("Too many redirects");
        }
        currentUrl = new URL(loc, currentUrl).toString();
        continue;
      }
      res = r;
      break;
    }
    if (!res) throw new Error("No response");

    const reader = res.body?.getReader();
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            if (bytes + value.byteLength > MAX_BYTES) break;
            bytes += value.byteLength;
            chunks.push(value);
          }
        }
      } finally {
        // Release the underlying connection when we bail early (e.g.
        // MAX_BYTES reached) or if an exception bubbles up. cancel() is a
        // no-op after the stream has fully drained.
        reader.cancel().catch(() => {});
      }
    }
    return buildResult(res, currentUrl, chunks, bytes, started);
  } catch (e) {
    if (e instanceof SsrfBlockedError) throw e;
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

function buildResult(
  res: Response,
  requestedUrl: string,
  chunks: Uint8Array[],
  bytes: number,
  started: number
): ScrapeResult {
  const buf = new Uint8Array(bytes);
  let offset = 0;
  for (const c of chunks) {
    buf.set(c, offset);
    offset += c.byteLength;
  }
  const html = new TextDecoder("utf-8", { fatal: false }).decode(buf);

  const finalUrl = res.url || requestedUrl;
  const signals = extractSignals(html, finalUrl);
  const visibleText = extractVisibleText(html);

  return {
    finalUrl,
    statusCode: res.status,
    html,
    loadTimeMs: Date.now() - started,
    signals,
    visibleText,
  };
}

function extractSignals(html: string, url: string): PageSignals {
  const $ = cheerio.load(html);
  const headings: { level: number; text: string }[] = [];
  for (let lv = 1; lv <= 6; lv++) {
    $(`h${lv}`).each((_, el) => {
      const txt = $(el).text().trim().slice(0, 180);
      if (txt) headings.push({ level: lv, text: txt });
    });
  }

  const ogTags: Record<string, string> = {};
  const twitterTags: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const p = $(el).attr("property") || "";
    const c = $(el).attr("content") || "";
    if (p) ogTags[p] = c;
  });
  $('meta[name^="twitter:"]').each((_, el) => {
    const n = $(el).attr("name") || "";
    const c = $(el).attr("content") || "";
    if (n) twitterTags[n] = c;
  });

  const imagesTotal = $("img").length;
  const imagesMissingAlt = $("img").filter(
    (_, el) => !($(el).attr("alt") || "").trim()
  ).length;

  let linksInternal = 0;
  let linksExternal = 0;
  let linksNofollow = 0;
  const host = safeHost(url);
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const rel = ($(el).attr("rel") || "").toLowerCase();
    if (rel.includes("nofollow")) linksNofollow++;
    if (
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    )
      return;
    const abs = toAbsolute(href, url);
    const h = safeHost(abs);
    if (!h) return;
    if (h === host) linksInternal++;
    else linksExternal++;
  });

  const formsCount = $("form").length;
  const scriptsCount = $("script").length;
  const stylesheetsCount = $('link[rel="stylesheet"]').length;
  const inlineStylesCount = $("style").length;

  const canonical = $('link[rel="canonical"]').attr("href") || null;
  const viewport = $('meta[name="viewport"]').attr("content") || null;
  const favicon =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    null;

  const hasSchemaOrg = $('script[type="application/ld+json"]').length > 0;
  const hasRobotsMeta = $('meta[name="robots"]').length > 0;
  const hasLangAttr = Boolean($("html").attr("lang"));
  const hasH1 = $("h1").length > 0;
  const hasGoogleAnalytics =
    /gtag\(|google-analytics|googletagmanager/i.test(html);
  const hasMetaPixel = /fbq\(|connect\.facebook\.net\/en_US\/fbevents/i.test(
    html
  );

  const ctaButtons: string[] = [];
  $("button, a.btn, a.button, .cta, input[type='submit']").each((_, el) => {
    const t = $(el).text().trim() || $(el).attr("value") || "";
    if (t && ctaButtons.length < 20) ctaButtons.push(t.slice(0, 60));
  });

  const phoneMatches =
    html.match(
      /(?:\+?\d{1,2}[\s-.]?)?\(?\d{3}\)?[\s-.]?\d{3}[\s-.]?\d{4}/g
    ) || [];
  const emailMatches =
    html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];

  const socialLinks: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (
      /(facebook\.com|twitter\.com|x\.com|instagram\.com|linkedin\.com|youtube\.com|tiktok\.com|pinterest\.com)/i.test(
        href
      )
    ) {
      if (socialLinks.length < 10) socialLinks.push(href);
    }
  });

  const wordCount = $("body").text().trim().split(/\s+/).filter(Boolean).length;

  return {
    statusCode: 200,
    htmlSize: Buffer.byteLength(html, "utf-8"),
    loadTimeMs: 0,
    wordCount,
    headings: headings.slice(0, 30),
    metaTitle: $("title").first().text().trim(),
    metaDescription: $('meta[name="description"]').attr("content") || "",
    metaKeywords: $('meta[name="keywords"]').attr("content") || null,
    canonical,
    ogTags,
    twitterTags,
    viewport,
    favicon,
    imagesTotal,
    imagesMissingAlt,
    linksInternal,
    linksExternal,
    linksNofollow,
    formsCount,
    scriptsCount,
    stylesheetsCount,
    inlineStylesCount,
    hasHttps: url.startsWith("https://"),
    hasSchemaOrg,
    hasRobotsMeta,
    hasLangAttr,
    hasH1,
    hasGoogleAnalytics,
    hasMetaPixel,
    hasOpenGraph: Object.keys(ogTags).length > 0,
    hasTwitterCard: Object.keys(twitterTags).length > 0,
    ctaButtons,
    phoneNumbers: Array.from(new Set(phoneMatches)).slice(0, 5),
    emails: Array.from(new Set(emailMatches)).slice(0, 5),
    socialLinks,
  };
}

function extractVisibleText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg").remove();
  const t = $("body").text().replace(/\s+/g, " ").trim();
  return t.slice(0, 8000);
}

function toAbsolute(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function safeHost(u: string): string | null {
  try {
    return new URL(u).host.toLowerCase();
  } catch {
    return null;
  }
}
