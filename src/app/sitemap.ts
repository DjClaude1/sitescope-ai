import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://sitescope-ai.vercel.app";
  const now = new Date();
  return ["/", "/pricing", "/login"].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    priority: p === "/" ? 1.0 : 0.6,
  }));
}
