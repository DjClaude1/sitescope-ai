import { NextResponse } from "next/server";
import { countAudits, listRecentPublicAudits } from "@/lib/storage";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  try {
    const [total, recent] = await Promise.all([
      countAudits(),
      listRecentPublicAudits(6),
    ]);
    return NextResponse.json(
      { total, recent },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json({ total: 0, recent: [] });
  }
}
