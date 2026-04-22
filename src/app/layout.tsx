import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SiteScope AI — Instant AI Website Audits",
  description:
    "Get a professional-grade SEO, performance, accessibility, conversion, and content audit of any website in under a minute. Powered by AI.",
  openGraph: {
    title: "SiteScope AI — Instant AI Website Audits",
    description:
      "Professional website audits in under a minute. SEO, performance, accessibility, conversion, content — all powered by AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "rgb(15 15 30)",
              color: "rgb(244 244 250)",
              border: "1px solid rgba(255,255,255,0.08)",
            },
          }}
        />
      </body>
    </html>
  );
}
