import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processCelebrationR2Transfer } from "../../../../lib/process-celebration-r2-transfer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

export async function GET(req: NextRequest) {
  const secret = process.env.CELEBRATION_R2_TRIGGER_SECRET?.trim();
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.CELEBRATION_R2_PROCESSOR_ENABLED !== "true") {
    return NextResponse.json({ enabled: false });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Configuration missing" }, { status: 503 });
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  try {
    const result = await processCelebrationR2Transfer(db);
    return NextResponse.json({ enabled: true, ...result });
  } catch {
    console.error("Could not advance the celebration R2 transfer.");
    return NextResponse.json({ error: "Transfer step failed" }, { status: 500 });
  }
}
