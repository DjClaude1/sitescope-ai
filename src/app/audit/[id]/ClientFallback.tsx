"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AuditReportView } from "@/components/AuditReportView";
import type { AuditReport } from "@/lib/types";

// Rendered only when the server could not find the audit in storage.
// Falls back to the in-browser sessionStorage cache written by the audit
// form (covers reports that exist only on this client instance), then to
// the API route. If all three miss, we show a friendly "not found" card.
export function ClientFallback({ id }: { id: string }) {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem(`report:${id}`);
    if (cached) {
      try {
        setReport(JSON.parse(cached) as AuditReport);
        return;
      } catch {
        /* ignore parse error, fall through to fetch */
      }
    }
    fetch(`/api/report/${id}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Report not found or expired.");
        const { report } = await r.json();
        setReport(report);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="card text-center py-16">
        <div className="text-xl font-medium mb-2">Report unavailable</div>
        <p className="text-white/60 mb-6">{error}</p>
        <Link href="/" className="btn btn-primary">
          Run a new audit
        </Link>
      </div>
    );
  }
  if (!report) {
    return (
      <div className="flex items-center justify-center py-32 text-white/60">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading report…
      </div>
    );
  }
  return <AuditReportView report={report} />;
}
