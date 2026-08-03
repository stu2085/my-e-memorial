import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
   const authHeader = req.headers.get("authorization");
const token = authHeader?.replace("Bearer ", "");

let user = null;

if (token) {
  const {
    data: { user: authenticatedUser },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (!userError && authenticatedUser) {
    user = authenticatedUser;
  }
}

    

    const { memorialId, updatePayload } = await req.json();

    if (!memorialId || !updatePayload) {
      return NextResponse.json(
        { error: "Missing memorial update information." },
        { status: 400 }
      );
    }

    const { data: memorial, error: memorialError } = await supabaseAdmin
      .from("memorials")
      .select("id, owner_id, is_living_preplan")
      .eq("id", memorialId)
      .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: "Memorial not found." },
        { status: 404 }
      );
    }

    const isOwner =
  !!user && memorial.owner_id === user.id;

let hasBackupAccess = false;

if (!isOwner && memorial.is_living_preplan) {
  const cookieValue = req.cookies.get(
    "myememorial_backup_access"
  )?.value;

  if (cookieValue) {
    const [cookieMemorialId, suppliedSignature] =
      cookieValue.split(":");

    if (
      cookieMemorialId === String(memorialId) &&
      suppliedSignature
    ) {
      const backupAccessSecret =
        process.env.SUPABASE_SERVICE_ROLE_KEY || "";

      const expectedSignature = createHmac(
        "sha256",
        backupAccessSecret
      )
        .update(String(memorialId))
        .digest("hex");

      const suppliedBuffer = Buffer.from(
        suppliedSignature,
        "utf8"
      );

      const expectedBuffer = Buffer.from(
        expectedSignature,
        "utf8"
      );

      if (
        suppliedBuffer.length === expectedBuffer.length &&
        timingSafeEqual(
          suppliedBuffer,
          expectedBuffer
        )
      ) {
        hasBackupAccess = true;
      }
    }
  }
}

if (!isOwner && !hasBackupAccess) {
  return NextResponse.json(
    { error: "You do not have permission to edit this memorial." },
    { status: 403 }
  );
}

    const { error: updateError } = await supabaseAdmin
  .from("memorials")
  .update({
    ...updatePayload,
    updated_at: new Date().toISOString(),
  })
  .eq("id", memorialId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MEMORIAL UPDATE API ERROR:", err);
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}