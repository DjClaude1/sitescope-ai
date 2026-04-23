import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_APP_URL || "https://sitescope-ai-kappa.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private / non-indexable surfaces. Login + dashboard are behind
        // auth, /api/* is JSON, and the callback routes are short-lived.
        disallow: [
          "/api/",
          "/dashboard",
          "/account/",
          "/auth/",
          "/login",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
