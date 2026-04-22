"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuditReportView } from "@/components/AuditReportView";
import type { AuditReport } from "@/lib/types";

export default function AuditPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prefer in-browser cache first (works even without a backing DB).
    const cached = sessionStorage.getItem(`report:${params.id}`);
    if (cached) {
      try {
        setReport(JSON.parse(cached) as AuditReport);
        return;
      } catch {
        /* ignore parse error */
      }
    }
    fetch(`/api/report/${params.id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Report not found or expired.");
        const { report } = await r.json();
        setReport(report);
      })
      .catch((e: Error) => setError(e.message));
  }, [params.id]);

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 py-10">
        {error ? (
          <div className="card text-center py-16">
            <div className="text-xl font-medium mb-2">Report unavailable</div>
            <p className="text-white/60 mb-6">{error}</p>
            <Link href="/" className="btn btn-primary">
              Run a new audit
            </Link>
          </div>
        ) : !report ? (
          <div className="flex items-center justify-center py-32 text-white/60">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading report…
          </div>
        ) : (
          <AuditReportView report={report} />
        )}
      </main>
      <Footer />
    </>
  );
}
