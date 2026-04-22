import { NextResponse } from "next/server";
import { getAudit } from "@/lib/storage";

export const runtime = "nodejs";
export const revalidate = 300;

function scoreColor(score: number) {
  if (score >= 80) return { fg: "#10b981", bg: "rgba(16,185,129,0.12)" };
  if (score >= 60) return { fg: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  return { fg: "#f43f5e", bg: "rgba(244,63,94,0.12)" };
}

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        return c;
    }
  });
}

function render(score: number, label: string): string {
  const { fg, bg } = scoreColor(score);
  const labelText = escapeXml(label.slice(0, 18));
  // Fixed-width two-part pill badge, shields.io style but on-brand.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="44" viewBox="0 0 220 44" role="img" aria-label="SiteScope AI ${score}/100">
  <defs>
    <linearGradient id="g" x2="0" y2="100%">
      <stop offset="0" stop-color="#0b1020" stop-opacity=".4"/>
      <stop offset="1" stop-opacity=".15"/>
    </linearGradient>
  </defs>
  <rect width="220" height="44" rx="8" fill="#0b1020"/>
  <rect width="140" height="44" rx="8" fill="url(#g)"/>
  <rect x="140" width="80" height="44" rx="8" fill="${bg}"/>
  <g font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-weight="600">
    <text x="18" y="20" fill="#ffffff" font-size="12" opacity=".7">${labelText}</text>
    <text x="18" y="34" fill="#ffffff" font-size="14">SiteScope AI</text>
    <text x="180" y="29" fill="${fg}" font-size="22" text-anchor="middle">${score}</text>
    <text x="202" y="33" fill="${fg}" font-size="11" opacity=".8" text-anchor="middle">/100</text>
  </g>
</svg>`;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const report = await getAudit(id);
  if (!report) {
    const svg = render(0, "not found");
    return new NextResponse(svg, {
      status: 404,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  }
  const label = (() => {
    try {
      return new URL(report.finalUrl || report.url).hostname.replace(
        /^www\./,
        "",
      );
    } catch {
      return "audited";
    }
  })();
  const svg = render(report.overallScore, label);
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
