import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const backupLoginAttempts = new Map<
  string,
  { count: number; resetAt: number }
>();

function getClientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: Request) {
  try {
    const { memorialId, email, password } = await req.json();

    const ip = getClientIp(req);
    const attemptKey = `${ip}:${memorialId || "unknown"}`;
    const now = Date.now();
    const existingAttempt = backupLoginAttempts.get(attemptKey);

    if (existingAttempt && existingAttempt.resetAt > now) {
      if (existingAttempt.count >= 5) {
        return NextResponse.json(
          { error: "Too many backup login attempts. Please try again later." },
          { status: 429 }
        );
      }

      backupLoginAttempts.set(attemptKey, {
        count: existingAttempt.count + 1,
        resetAt: existingAttempt.resetAt,
      });
    } else {
      backupLoginAttempts.set(attemptKey, {
        count: 1,
        resetAt: now + 15 * 60 * 1000,
      });
    }

    if (!memorialId || !email || !password) {
      return NextResponse.json(
        { error: "Missing backup login information." },
        { status: 400 }
      );
    }

    const { data: memorial, error } = await supabaseAdmin
      .from("memorials")
      .select("id, backup_email, backup_password, is_living_preplan")
      .eq("id", memorialId)
      .single();

    if (error || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }
if (!memorial.is_living_preplan) {
  return NextResponse.json(
    { error: "Backup access is only available for personal pre-planned memorials." },
    { status: 403 }
  );
}
    const emailMatches =
      String(memorial.backup_email || "").trim().toLowerCase() ===
      String(email || "").trim().toLowerCase();

    const passwordMatches =
      String(memorial.backup_password || "") === String(password || "");

    if (!emailMatches || !passwordMatches) {
      return NextResponse.json(
        { error: "Backup email or password is incorrect." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("BACKUP LOGIN API ERROR:", err);

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}