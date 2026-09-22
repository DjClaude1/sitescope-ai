import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "LeadFix AI — Turn Your Website Into a Lead Machine",
  description:
    "Free 5-minute website and lead-leak audits for Cape Town small businesses. Find conversion problems and get practical fixes.",
  openGraph: {
    title: "LeadFix AI — Turn Your Website Into a Lead Machine",
    description:
      "Find website conversion leaks and turn more visitors into enquiries with LeadFix AI.",
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
