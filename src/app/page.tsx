"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check, Loader2, MessageCircle, Search, Smartphone, Zap } from "lucide-react";

const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition placeholder:text-white/35 focus:border-cyan-400/50";

export default function Page() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function submitAudit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Submission failed");
      setStatus("success");
      event.currentTarget.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="text-xl font-bold tracking-tight">LeadFix<span className="text-cyan-400">.AI</span></div>
        <a href="#audit" className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/5">Free audit</a>
      </nav>
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-14 md:pt-24"><div className="max-w-3xl">
        <div className="mb-5 inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">Cape Town • South Africa • same-day website fixes</div>
        <h1 className="text-5xl font-black tracking-tight md:text-7xl">Turn your website into a <span className="text-cyan-400">lead machine.</span></h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">We find the leaks that make visitors leave, rebuild the important parts, and connect the site to WhatsApp so customers can actually contact you.</p>
        <div className="mt-8 flex flex-wrap gap-3"><a href="#audit" className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-black hover:bg-cyan-300">Get my free 5-minute audit <ArrowRight size={18}/></a><a href="#pricing" className="rounded-xl border border-white/15 px-6 py-3 font-semibold hover:bg-white/5">See pricing</a></div>
        <p className="mt-4 text-xs text-white/40">No fake guarantees. No long contracts. We show you the problems before asking you to buy.</p>
      </div></section>
      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-20 md:grid-cols-4">
        {[["Website rebuild","We rebuild outdated or underperforming sites into fast, mobile-first lead pages."],["WhatsApp funnel","Every key action goes straight to a WhatsApp conversation or enquiry."],["Local search","We improve the pages and calls-to-action that turn local searches into calls and messages."],["Conversion copy","Clear offers, trust signals and calls-to-action designed to make the next step obvious."]].map(([title,body]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="mb-3 font-bold">{title}</div><p className="text-sm leading-6 text-white/55">{body}</p></div>)}
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-20"><div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[.07] to-white/[.02] p-7 md:p-10"><div className="grid gap-10 md:grid-cols-2">
        <div><p className="text-sm font-semibold text-cyan-300">WHAT WE FIX</p><h2 className="mt-2 text-3xl font-bold">The five things that cost local businesses enquiries.</h2><div className="mt-7 space-y-4">
          {[[Smartphone,"Slow or confusing mobile experience"],[Zap,"Weak calls-to-action"],[MessageCircle,"No obvious WhatsApp/contact path"],[Search,"Poor local-search landing pages"],[Check,"Outdated copy and trust signals"]].map(([Icon,label]) => { const Component = Icon as typeof Smartphone; return <div className="flex items-center gap-3" key={label as string}><div className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300"><Component size={18}/></div><span className="text-white/75">{label as string}</span></div>; })}
        </div></div>
        <div id="audit" className="rounded-2xl bg-[#0b0f16] p-6"><p className="text-sm font-semibold text-cyan-300">FREE LEAD LEAK AUDIT</p><h3 className="mt-2 text-2xl font-bold">Tell us where to look.</h3>
          {status === "success" ? <div className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-5"><div className="font-bold text-cyan-300">Audit request received.</div><p className="mt-2 text-sm leading-6 text-white/65">We&apos;ll review the website and reply with practical observations. No obligation to buy.</p><button onClick={() => setStatus("idle")} className="mt-4 text-sm font-bold text-cyan-300">Submit another request</button></div> :
          <form onSubmit={submitAudit} className="mt-6 space-y-3"><input required name="business" placeholder="Business name" className={inputClass}/><input required type="url" name="website" placeholder="Website URL (https://...)" className={inputClass}/><input type="email" name="email" placeholder="Email (optional)" className={inputClass}/><input name="whatsapp" placeholder="WhatsApp or phone (optional)" className={inputClass}/><textarea required name="problem" placeholder="What feels broken or not working?" rows={4} className={inputClass}/><input name="website2" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden"/><button disabled={status === "loading"} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60">{status === "loading" ? <><Loader2 size={18} className="animate-spin"/> Sending...</> : "Request my free audit"}</button>{status === "error" && <p className="text-sm text-red-300">{error}</p>}</form>}
          <p className="mt-3 text-xs text-white/35">Your details are used only to respond to this audit request.</p>
        </div>
      </div></div></section>
      <section id="pricing" className="mx-auto max-w-6xl px-5 pb-20"><p className="text-sm font-semibold text-cyan-300">SIMPLE PRICING</p><h2 className="mt-2 text-3xl font-bold">A small first sale can fund the next build.</h2><div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border p-6 border-white/10 bg-white/[.03]"><div className="text-lg font-bold">Starter Fix</div><div className="mt-3 text-3xl font-black">R1,500</div><p className="mt-3 text-sm leading-6 text-white/55">One key page rebuilt + WhatsApp CTA + mobile conversion cleanup</p><a href="#audit" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">Start with the audit <ArrowRight size={15}/></a></div>
        <div className="rounded-2xl border p-6 border-cyan-400/40 bg-cyan-400/[.06]"><div className="text-lg font-bold">Growth Build</div><div className="mt-3 text-3xl font-black">R3,500</div><p className="mt-3 text-sm leading-6 text-white/55">Multi-section rebuild + local SEO foundations + enquiry funnel</p><a href="#audit" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">Start with the audit <ArrowRight size={15}/></a></div>
        <div className="rounded-2xl border p-6 border-white/10 bg-white/[.03]"><div className="text-lg font-bold">Care Plan</div><div className="mt-3 text-3xl font-black">R750/mo</div><p className="mt-3 text-sm leading-6 text-white/55">Updates, copy tweaks, conversion checks and monthly improvements</p><a href="#audit" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">Start with the audit <ArrowRight size={15}/></a></div>
      </div></section>
      <footer className="border-t border-white/10 px-5 py-10 text-center text-sm text-white/40">LeadFix.AI • Cape Town • Practical websites that help customers take the next step.</footer>
    </main>
  );
}
