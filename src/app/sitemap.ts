import type { MetadataRoute } from "next";
import { listTopPublicAudits } from "@/lib/storage";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_APP_URL || "https://sitescope-ai-kappa.vercel.app";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, priority: 1.0, changeFrequency: "daily" },
    { url: `${base}/pricing`, lastModified: now, priority: 0.7, changeFrequency: "monthly" },
    { url: `${base}/login`, lastModified: now, priority: 0.4, changeFrequency: "yearly" },
  ];

  // Include the top public audits from the last 30 days. These are
  // high-quality, long-tail SEO pages (e.g. "stripe.com scored 91/100").
  // Low-score audits are excluded at the metadata layer (noindex), so we
  // also filter here to keep the sitemap clean.
  try {
    const top = await listTopPublicAudits(100, 30);
    for (const a of top) {
      if (a.overallScore < 60) continue;
      staticRoutes.push({
        url: `${base}/audit/${a.id}`,
        lastModified: new Date(a.createdAt),
        priority: 0.5,
        changeFrequency: "monthly",
      });
    }
  } catch {
    // If Supabase is unavailable during sitemap generation, fall back to
    // just the static routes rather than failing the response.
  }

  return staticRoutes;
}
