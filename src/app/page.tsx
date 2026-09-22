import { ArrowRight, Check, MessageCircle, Search, Smartphone, Zap } from "lucide-react";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="text-xl font-bold tracking-tight">LeadFix<span className="text-cyan-400">.AI</span></div>
        <a href="#audit" className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/5">Free audit</a>
      </nav>

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-14 md:pt-24">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">Cape Town • South Africa • same-day website fixes</div>
          <h1 className="text-5xl font-black tracking-tight md:text-7xl">Turn your website into a <span className="text-cyan-400">lead machine.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">We find the leaks that make visitors leave, rebuild the important parts, and connect the site to WhatsApp so customers can actually contact you.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#audit" className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-black hover:bg-cyan-300">Get my free 5-minute audit <ArrowRight size={18}/></a>
            <a href="#pricing" className="rounded-xl border border-white/15 px-6 py-3 font-semibold hover:bg-white/5">See pricing</a>
          </div>
          <p className="mt-4 text-xs text-white/40">No fake guarantees. No long contracts. We show you the problems before asking you to buy.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-20 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="mb-3 font-bold">Website rebuild</div><p className="text-sm leading-6 text-white/55">We rebuild outdated or underperforming sites into fast, mobile-first lead pages.</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="mb-3 font-bold">WhatsApp funnel</div><p className="text-sm leading-6 text-white/55">Every key action goes straight to a WhatsApp conversation or enquiry.</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="mb-3 font-bold">Local search</div><p className="text-sm leading-6 text-white/55">We improve the pages and calls-to-action that turn local searches into calls and messages.</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="mb-3 font-bold">Conversion copy</div><p className="text-sm leading-6 text-white/55">Clear offers, trust signals and calls-to-action designed to make the next step obvious.</p></div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[.07] to-white/[.02] p-7 md:p-10">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-cyan-300">WHAT WE FIX</p>
              <h2 className="mt-2 text-3xl font-bold">The five things that cost local businesses enquiries.</h2>
              <div className="mt-7 space-y-4">
                <div className="flex items-center gap-3" key="Slow or confusing mobile experience"><div className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300"><Smartphone size={18}/></div><span className="text-white/75">Slow or confusing mobile experience</span></div>
                <div className="flex items-center gap-3" key="Weak calls-to-action"><div className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300"><Zap size={18}/></div><span className="text-white/75">Weak calls-to-action</span></div>
                <div className="flex items-center gap-3" key="No obvious WhatsApp/contact path"><div className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300"><MessageCircle size={18}/></div><span className="text-white/75">No obvious WhatsApp/contact path</span></div>
                <div className="flex items-center gap-3" key="Poor local-search landing pages"><div className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300"><Search size={18}/></div><span className="text-white/75">Poor local-search landing pages</span></div>
                <div className="flex items-center gap-3" key="Outdated copy and trust signals"><div className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300"><Check size={18}/></div><span className="text-white/75">Outdated copy and trust signals</span></div>
              </div>
            </div>
            <div id="audit" className="rounded-2xl bg-[#0b0f16] p-6">
              <p className="text-sm font-semibold text-cyan-300">FREE LEAD LEAK AUDIT</p>
              <h3 className="mt-2 text-2xl font-bold">Tell us where to look.</h3>
              <form action="mailto:gameeater36@gmail.com" method="post" encType="text/plain" className="mt-6 space-y-3">
                <input required name="Business" placeholder="Business name" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35"/>
                <input required name="Website" placeholder="Website URL" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35"/>
                <input name="WhatsApp" placeholder="WhatsApp or phone" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35"/>
                <textarea required name="Problem" placeholder="What feels broken or not working?" rows={4} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35"/>
                <button className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-bold text-black">Request my free audit</button>
              </form>
              <p className="mt-3 text-xs text-white/35">We will reply with practical observations. No obligation to buy.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-5 pb-20">
        <p className="text-sm font-semibold text-cyan-300">SIMPLE PRICING</p>
        <h2 className="mt-2 text-3xl font-bold">A small first sale can fund the next build.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border p-6 border-white/10 bg-white/[.03]"><div className="text-lg font-bold">Starter Fix</div><div className="mt-3 text-3xl font-black">R1,500</div><p className="mt-3 text-sm leading-6 text-white/55">One key page rebuilt + WhatsApp CTA + mobile conversion cleanup</p><a href="#audit" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">Start with the audit <ArrowRight size={15}/></a></div>
          <div className="rounded-2xl border p-6 border-cyan-400/40 bg-cyan-400/[.06]"><div className="text-lg font-bold">Growth Build</div><div className="mt-3 text-3xl font-black">R3,500</div><p className="mt-3 text-sm leading-6 text-white/55">Multi-section rebuild + local SEO foundations + enquiry funnel</p><a href="#audit" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">Start with the audit <ArrowRight size={15}/></a></div>
          <div className="rounded-2xl border p-6 border-white/10 bg-white/[.03]"><div className="text-lg font-bold">Care Plan</div><div className="mt-3 text-3xl font-black">R750/mo</div><p className="mt-3 text-sm leading-6 text-white/55">Updates, copy tweaks, conversion checks and monthly improvements</p><a href="#audit" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">Start with the audit <ArrowRight size={15}/></a></div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-10 text-center text-sm text-white/40">LeadFix.AI • Cape Town • Practical websites that help customers take the next step.</footer>
    </main>
  );
}
