import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CompareForm } from "./CompareForm";
import { Swords, ArrowRight } from "lucide-react";

export const runtime = "nodejs";
export const metadata = {
  title: "Compare any two websites · SiteScope AI",
  description:
    "Run a side-by-side AI audit of any two websites — SEO, performance, accessibility, conversion, and content scored head-to-head.",
  alternates: { canonical: "/compare" },
};

const EXAMPLES = [
  ["stripe.com", "paypal.com"],
  ["vercel.com", "netlify.com"],
  ["notion.so", "linear.app"],
  ["figma.com", "canva.com"],
];

export default function ComparePage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 chip mb-4">
            <Swords className="w-4 h-4" /> Side-by-side AI audits
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3">
            Compare any two websites.
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            Drop two URLs — we&apos;ll run a full audit on each and show you
            who wins on SEO, performance, accessibility, conversion, and
            content. Shareable URL for the result.
          </p>
        </div>

        <CompareForm />

        <div className="mt-10">
          <div className="text-xs uppercase tracking-widest text-white/40 mb-3 text-center">
            popular matchups
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {EXAMPLES.map(([a, b]) => (
              <Link
                key={`${a}-${b}`}
                href={`/compare/${a}/${b}`}
                className="chip hover:bg-white/10 transition inline-flex items-center gap-1.5"
              >
                {a} <ArrowRight className="w-3 h-3 opacity-60" /> {b}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
