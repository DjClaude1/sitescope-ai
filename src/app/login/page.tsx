"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole } from "lucide-react";
import { supabase } from "@/lib/supabase-browser";

export default function LoginPage() {
 const router=useRouter(); const [mode,setMode]=useState<"login"|"signup">("login");
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [status,setStatus]=useState(""); const [loading,setLoading]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{if(data.session)router.replace("/dashboard")})},[router]);
 async function submit(e:FormEvent){e.preventDefault();setLoading(true);setStatus("");
 const r=mode==="login"?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password});
 setLoading(false); if(r.error){setStatus(r.error.message);return}
 if(mode==="signup"&&!r.data.session){setStatus("Account created. Check your email to confirm it, then sign in.");return}
 router.replace("/dashboard");
 }
 return <main className="min-h-screen bg-[#07090d] text-white grid place-items-center px-5"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[.04] p-8">
 <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300"><LockKeyhole/></div>
 <h1 className="text-3xl font-black text-center">LeadFix Admin</h1><p className="mt-2 text-center text-sm text-white/50">Private prospects, leads and outreach.</p>
 <form onSubmit={submit} className="mt-7 space-y-3"><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Admin email" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none"/>
 <input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (8+ characters)" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none"/>
 <button disabled={loading} className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-black">{loading?<Loader2 className="mx-auto animate-spin"/>:mode==="login"?"Sign in":"Create admin account"}</button></form>
 {status&&<p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">{status}</p>}
 <button onClick={()=>{setMode(mode==="login"?"signup":"login");setStatus("")}} className="mt-5 w-full text-sm text-cyan-300">{mode==="login"?"Create the admin account":"I already have an account"}</button>
 </div></main>
}