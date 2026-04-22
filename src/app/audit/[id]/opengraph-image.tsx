import { ImageResponse } from "next/og";
import { getAudit } from "@/lib/storage";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SiteScope AI audit report";

function hostOf(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}

function scoreGradient(score: number) {
  if (score >= 80) return "linear-gradient(135deg, #10b981, #34d399)";
  if (score >= 60) return "linear-gradient(135deg, #f59e0b, #fbbf24)";
  return "linear-gradient(135deg, #f43f5e, #fb7185)";
}

export default async function OgImage({ params }: { params: { id: string } }) {
  const report = await getAudit(params.id);
  const host = report ? hostOf(report.finalUrl || report.url) : "sitescope.ai";
  const score = report?.overallScore ?? 0;
  const rawTitle = report?.title || host;
  const title = rawTitle.length > 120 ? rawTitle.slice(0, 117) + "…" : rawTitle;
  const tagline =
    "AI-powered audit · SEO, performance, accessibility, conversion, content";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 64,
          background: "#070b1d",
          color: "white",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 24,
            }}
          >
            S
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 600 }}>
            SiteScope AI
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              color: "#9ca3af",
              fontSize: 20,
            }}
          >
            Website audit
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: 64,
            marginTop: 48,
          }}
        >
          <div
            style={{
              width: 280,
              height: 280,
              borderRadius: 999,
              background: scoreGradient(score),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 40px 100px rgba(99,102,241,0.4)",
            }}
          >
            <div
              style={{
                width: 240,
                height: 240,
                borderRadius: 999,
                background: "#070b1d",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 120,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {String(score)}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  color: "#9ca3af",
                  marginTop: 6,
                }}
              >
                / 100
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 8,
            }}
          >
            <div style={{ display: "flex", fontSize: 30, color: "#9ca3af" }}>
              {host}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 48,
                fontWeight: 700,
                lineHeight: 1.1,
                maxWidth: 720,
                overflow: "hidden",
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 16,
                fontSize: 22,
                color: "#d1d5db",
              }}
            >
              {tagline}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 32,
            color: "#6b7280",
            fontSize: 18,
          }}
        >
          <div style={{ display: "flex" }}>Audited with SiteScope AI</div>
          <div style={{ display: "flex" }}>sitescope-ai-kappa.vercel.app</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
