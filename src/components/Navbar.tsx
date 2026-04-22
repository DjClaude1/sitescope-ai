"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Gauge } from "lucide-react";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";

export function Navbar() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = getBrowserSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email || null);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email || null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md border-b border-white/5 bg-[rgb(7_7_20_/_0.65)]">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-2 flex items-center justify-center">
            <Gauge className="w-5 h-5 text-white" />
          </span>
          SiteScope <span className="text-brand-2">AI</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/pricing" className="btn btn-ghost px-3 py-1.5 text-sm">
            Pricing
          </Link>
          {isSupabaseConfigured && email ? (
            <Link href="/dashboard" className="btn btn-primary px-3 py-1.5 text-sm">
              Dashboard
            </Link>
          ) : isSupabaseConfigured ? (
            <Link href="/login" className="btn btn-primary px-3 py-1.5 text-sm">
              Log in
            </Link>
          ) : (
            <Link href="/#run" className="btn btn-primary px-3 py-1.5 text-sm">
              Run audit
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
