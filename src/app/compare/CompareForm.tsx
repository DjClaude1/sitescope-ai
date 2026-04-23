"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Swords } from "lucide-react";

function extractHost(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  let u = t;
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const parsed = new URL(u);
    if (!parsed.hostname.includes(".")) return null;
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function CompareForm() {
  const router = useRouter();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const hostA = extractHost(a);
    const hostB = extractHost(b);
    if (!hostA || !hostB) {
      setError("Enter a valid URL for both sites (e.g. stripe.com).");
      return;
    }
    if (hostA === hostB) {
      setError("Pick two different sites to compare.");
      return;
    }
    setBusy(true);
    router.push(`/compare/${hostA}/${hostB}`);
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-white/50">
            Site A
          </span>
          <div className="mt-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-black/30 border border-white/10">
            <input
              type="text"
              className="flex-1 bg-transparent outline-none text-base placeholder:text-white/30"
              placeholder="stripe.com"
              value={a}
              onChange={(e) => setA(e.target.value)}
              autoFocus
              disabled={busy}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-white/50">
            Site B
          </span>
          <div className="mt-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-black/30 border border-white/10">
            <input
              type="text"
              className="flex-1 bg-transparent outline-none text-base placeholder:text-white/30"
              placeholder="paypal.com"
              value={b}
              onChange={(e) => setB(e.target.value)}
              disabled={busy}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </label>
      </div>
      {error && <div className="text-sm text-rose-300">{error}</div>}
      <button className="btn btn-primary w-full justify-center py-3" disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Running audits…
          </>
        ) : (
          <>
            <Swords className="w-4 h-4" /> Compare
          </>
        )}
      </button>
      <p className="text-xs text-white/40 text-center">
        Both audits run in parallel. Fresh audits take ~45s; cached results
        (last 7 days) are instant.
      </p>
    </form>
  );
}
