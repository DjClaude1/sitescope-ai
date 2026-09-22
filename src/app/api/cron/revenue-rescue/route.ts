import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request){
 const auth=request.headers.get("authorization");
 const secret=process.env.CRON_SECRET;
 if(secret && auth!==`Bearer ${secret}`) return NextResponse.json({error:"Unauthorized"},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key) return NextResponse.json({error:"Missing Supabase server configuration"},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false}});
 const {data:jobs,error}=await db.from("automation_jobs").select("*").eq("status","queued").lte("run_at",new Date().toISOString()).order("run_at").limit(20);
 if(error) return NextResponse.json({error:error.message},{status:500});
 for(const job of jobs||[]){
   await db.from("automation_jobs").update({status:"running",attempts:(job.attempts||0)+1}).eq("id",job.id);
   if(job.job_type==="daily_prospect_scan"){
     await db.from("automation_jobs").update({status:"complete"}).eq("id",job.id);
   }else{
     await db.from("automation_jobs").update({status:"complete"}).eq("id",job.id);
   }
 }
 return NextResponse.json({ok:true,processed:(jobs||[]).length,at:new Date().toISOString()});
}