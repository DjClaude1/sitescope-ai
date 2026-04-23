import type { MetadataRoute } from "next";
import { NICHES } from "@/lib/seo/niches";
import { UNIQUE_PAIRS } from "@/lib/seo/pairs";
import { listRecentPublicAudits } from "@/lib/storage";

function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL || "https://sitescope-ai-kappa.vercel.app"
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, priority: 1.0, changeFrequency: "weekly" },
    { url: `${base}/pricing`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${base}/compare`, lastModified: now, priority: 0.9, changeFrequency: "weekly" },
    { url: `${base}/top`, lastModified: now, priority: 0.9, changeFrequency: "weekly" },
    { url: `${base}/login`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
  ];

  const nichePages: MetadataRoute.Sitemap = NICHES.map((n) => ({
    url: `${base}/top/${n.slug}`,
    lastModified: now,
    priority: 0.8,
    changeFrequency: "weekly",
  }));

  const pairPages: MetadataRoute.Sitemap = UNIQUE_PAIRS.map(([a, b]) => ({
    url: `${base}/compare/${a}/${b}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "weekly",
  }));

  // Include recent public audits so their `/audit/[id]` pages are indexable.
  let auditPages: MetadataRoute.Sitemap = [];
  try {
    const recent = await listRecentPublicAudits(200);
    auditPages = recent.map((a) => ({
      url: `${base}/audit/${a.id}`,
      lastModified: new Date(a.createdAt),
      priority: 0.6,
      changeFrequency: "monthly",
    }));
  } catch {
    // Fail open — sitemap still generates without the dynamic audits.
  }

  return [...staticPages, ...nichePages, ...pairPages, ...auditPages];
}
